// ring_runtime.cpp — C ABI runtime for Ring LLVM native backend
// Target: x86_64-pc-windows-msvc (MSVC compatible)
// Convention: all functions extern "C", void* in/out (or int64_t/double for unboxing)
// Memory: malloc-only, no free (bootstrap compiler is short-lived)

#include <cstdint>
#include <cstdlib>
#include <cstdio>
#include <cstring>
#include <csetjmp>
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <algorithm>

#include <cctype>
#include <sstream>

#ifdef _WIN32
#include <direct.h>  // _getcwd
#include <io.h>      // _access
#include <windows.h> // GetFullPathName
#include <intrin.h>  // _ReturnAddress
#define PATH_SEP '\\'
#else
#include <unistd.h>  // getcwd, access
#define PATH_SEP '/'
#endif

// ============================================================================
// Type aliases (documentation only — all cross-boundary types are void*)
//   Str          = std::string*
//   List         = std::vector<void*>*
//   Map          = std::unordered_map<std::string, void*>*
//   MapInt       = std::unordered_map<int64_t, void*>*
//   Set          = std::unordered_set<std::string>*
//   SetInt       = std::unordered_set<int64_t>*
//   StringBuilder = std::string*
// ============================================================================

// ============================================================================
// RingClosure — closure representation for higher-order functions
// ============================================================================

struct RingClosure {
    void* fn_ptr;   // function pointer
    void* env_ptr;  // captured environment pointer
};

typedef void* (*ring_fn_1)(void* env, void* arg);
typedef void* (*ring_fn_2)(void* env, void* a, void* b);

// ============================================================================
// Forward declarations
// ============================================================================

static void* ring_enum_some(void* val);
static void* ring_enum_none();

// ============================================================================
// Global state
// ============================================================================

static int g_argc = 0;
static char** g_argv = nullptr;

static int g_chk = 0;
static const char* g_last_fn = "";
static const char* g_trace_buf[64];
static void* g_trace_args[64];
static int g_trace_idx = 0;
#define CHK(name) do { g_chk++; g_last_fn = name; g_trace_buf[g_trace_idx & 63] = name; g_trace_args[g_trace_idx & 63] = nullptr; g_trace_idx++; } while(0)
#define CHK_ARG(name, arg) do { g_chk++; g_last_fn = name; g_trace_buf[g_trace_idx & 63] = name; g_trace_args[g_trace_idx & 63] = arg; g_trace_idx++; } while(0)

static void dump_trace() {
    fprintf(stderr, "=== Last 64 calls (chk=%d) ===\n", g_chk);
    for (int i = 0; i < 64; i++) {
        int idx = (g_trace_idx - 64 + i) & 63;
        if (g_trace_buf[idx]) {
            if (g_trace_args[idx])
                fprintf(stderr, "  [%d] %s ptr=%p\n", g_chk - 64 + i + 1, g_trace_buf[idx], g_trace_args[idx]);
            else
                fprintf(stderr, "  [%d] %s\n", g_chk - 64 + i + 1, g_trace_buf[idx]);
        }
    }
    fflush(stderr);
}

#ifdef _WIN32
static LONG WINAPI crash_handler(EXCEPTION_POINTERS* ep) {
    HMODULE mod = GetModuleHandle(NULL);
    uintptr_t rva = ep->ContextRecord->Rip - (uintptr_t)mod;
    fprintf(stderr, "CRASH chk=%d fn=%s code=0x%08lx rip=%p base=%p rva=0x%llx\n",
            g_chk, g_last_fn,
            ep->ExceptionRecord->ExceptionCode,
            (void*)ep->ContextRecord->Rip,
            (void*)mod,
            (unsigned long long)rva);
    fprintf(stderr, "  rax=%p rbx=%p rcx=%p rdx=%p\n  rsi=%p rdi=%p rsp=%p rbp=%p\n",
            (void*)ep->ContextRecord->Rax, (void*)ep->ContextRecord->Rbx,
            (void*)ep->ContextRecord->Rcx, (void*)ep->ContextRecord->Rdx,
            (void*)ep->ContextRecord->Rsi, (void*)ep->ContextRecord->Rdi,
            (void*)ep->ContextRecord->Rsp, (void*)ep->ContextRecord->Rbp);
    fprintf(stderr, "  fault_addr=%p\n", (void*)ep->ExceptionRecord->ExceptionInformation[1]);
    // Dump instruction bytes at crash point
    unsigned char* ip = (unsigned char*)ep->ContextRecord->Rip;
    fprintf(stderr, "  bytes at rip: ");
    for (int i = -5; i < 10; i++) fprintf(stderr, "%02x ", ip[i]);
    fprintf(stderr, "\n");
    // Stack walk: dump potential return addresses and raw stack data
    uintptr_t base = (uintptr_t)mod;
    uintptr_t text_end = base + 0xB4000;
    uintptr_t* sp = (uintptr_t*)ep->ContextRecord->Rsp;
    fprintf(stderr, "  stack return addresses (RVA):\n");
    int found = 0;
    for (int i = 0; i < 128 && found < 20; i++) {
        uintptr_t val = sp[i];
        if (val > base && val < text_end) {
            fprintf(stderr, "    [rsp+0x%x] = %p (rva=0x%llx)\n",
                    i * 8, (void*)val, (unsigned long long)(val - base));
            found++;
        }
    }
    // Dump raw stack for manual inspection (first 128 qwords)
    fprintf(stderr, "  raw stack dump:\n");
    for (int i = 0; i < 128; i += 4) {
        fprintf(stderr, "    [rsp+0x%03x] %016llx %016llx %016llx %016llx\n",
                i * 8, (unsigned long long)sp[i], (unsigned long long)sp[i+1],
                (unsigned long long)sp[i+2], (unsigned long long)sp[i+3]);
    }
    // Deep inspection: follow InferResult -> HExpr -> tag chain
    // apply_subst frame: push rsi,rdi,rbx (24) + sub rsp,0x150 → 0x168 total + 8 for ret addr
    uintptr_t caller_rsp = (uintptr_t)sp + 0x170;
    // InferResult* at [caller_rsp+0x78]
    fprintf(stderr, "  caller (infer_method_call) rsp=%p\n", (void*)caller_rsp);
    __try {
        uintptr_t infer_result_ptr = *(uintptr_t*)(caller_rsp + 0x78);
        fprintf(stderr, "  InferResult* = %p\n", (void*)infer_result_ptr);
        if (infer_result_ptr > 0x10000) {
            uintptr_t hexpr_ptr = *(uintptr_t*)infer_result_ptr;
            uintptr_t subst_ptr = *(uintptr_t*)(infer_result_ptr + 8);
            uintptr_t effects_ptr = *(uintptr_t*)(infer_result_ptr + 16);
            fprintf(stderr, "  InferResult.hexpr = %p, .subst = %p, .effects = %p\n",
                    (void*)hexpr_ptr, (void*)subst_ptr, (void*)effects_ptr);
            if (hexpr_ptr > 0x10000) {
                int64_t hexpr_tag = *(int64_t*)hexpr_ptr;
                fprintf(stderr, "  HExpr tag = %lld\n", (long long)hexpr_tag);
                uintptr_t* hdata = (uintptr_t*)hexpr_ptr;
                fprintf(stderr, "  HExpr data:");
                for (int k = 0; k < 9; k++) {
                    fprintf(stderr, " [%d]=%p", k, (void*)hdata[k]);
                }
                fprintf(stderr, "\n");
                // If tag=4 (Ident), field[1] is name (Str = std::string*)
                if (hexpr_tag == 4 && hdata[1] > 0x10000) {
                    std::string* name = (std::string*)hdata[1];
                    fprintf(stderr, "  Ident.name = \"%s\"\n", name->c_str());
                    // field[2] = resolved_name (Option<Str>), field[3] = def_id (Option<Int>)
                    if (hdata[2] > 0x10000) {
                        int64_t opt_tag = *(int64_t*)hdata[2];
                        if (opt_tag == 0 && ((uintptr_t*)hdata[2])[1] > 0x10000) {
                            fprintf(stderr, "  Ident.resolved_name = some(\"%s\")\n",
                                    ((std::string*)((uintptr_t*)hdata[2])[1])->c_str());
                        }
                    }
                }
            }
        }
    } __except(EXCEPTION_EXECUTE_HANDLER) {
        fprintf(stderr, "  [failed to read caller data]\n");
    }
    fflush(stderr);
    dump_trace();
    return EXCEPTION_EXECUTE_HANDLER;
}
#endif

extern "C" void ring_runtime_init(int argc, char** argv) {
    g_argc = argc;
    g_argv = argv;
#ifdef _WIN32
    SetUnhandledExceptionFilter(crash_handler);
#endif
}

// ============================================================================
// Boxing / Unboxing (6)
// ============================================================================

extern "C" void* ring_box_int(int64_t val) {
    CHK("box_int");
    int64_t* p = (int64_t*)malloc(sizeof(int64_t));
    *p = val;
    return (void*)p;
}

extern "C" int64_t ring_unbox_int(void* p) {
    CHK("unbox_int");
    if (!p) {
        HMODULE mod = GetModuleHandle(NULL);
        uintptr_t rva = (uintptr_t)_ReturnAddress() - (uintptr_t)mod;
        fprintf(stderr, "FATAL: ring_unbox_int(null) at chk %d caller_rva=0x%llx\n", g_chk, (unsigned long long)rva);
        fflush(stderr); dump_trace(); exit(1);
    }
    if ((uintptr_t)p < 0x10000) {
        fprintf(stderr, "FATAL: ring_unbox_int raw_int_as_ptr=%p at chk %d\n", p, g_chk);
        fflush(stderr);
        exit(1);
    }
#ifdef _WIN32
    __try {
        return *(int64_t*)p;
    } __except(EXCEPTION_EXECUTE_HANDLER) {
        HMODULE mod = GetModuleHandle(NULL);
        uintptr_t rva = (uintptr_t)_ReturnAddress() - (uintptr_t)mod;
        fprintf(stderr, "FATAL: ring_unbox_int access violation ptr=%p chk=%d caller_rva=0x%llx\n", p, g_chk, (unsigned long long)rva);
        fflush(stderr);
        dump_trace();
        exit(1);
    }
#else
    return *(int64_t*)p;
#endif
}

extern "C" void* ring_box_float(double val) {
    double* p = (double*)malloc(sizeof(double));
    *p = val;
    return (void*)p;
}

extern "C" double ring_unbox_float(void* p) {
    return *(double*)p;
}

extern "C" void* ring_box_bool(int64_t val) {
    CHK("box_bool");
    int64_t* p = (int64_t*)malloc(sizeof(int64_t));
    *p = (val != 0) ? 1 : 0;
    return (void*)p;
}

extern "C" int64_t ring_unbox_bool(void* p) {
    CHK_ARG("unbox_bool", p);
    if (!p) { fprintf(stderr, "FATAL: ring_unbox_bool(null) at chk %d\n", g_chk); fflush(stderr); dump_trace(); exit(1); }
    if ((uintptr_t)p < 0x10000) {
        fprintf(stderr, "FATAL: ring_unbox_bool raw_val_as_ptr=%p at chk %d\n", p, g_chk);
        fflush(stderr); dump_trace(); exit(1);
    }
    return *(int64_t*)p;
}

// ============================================================================
// Str (~15)
// ============================================================================

extern "C" void* ring_str_new() {
    return (void*)new std::string();
}

extern "C" void* ring_str_from_cstr(const char* cstr) {
    CHK("str_from_cstr");
    return (void*)new std::string(cstr);
}

extern "C" int64_t ring_str_len(void* s) {
    CHK("str_len");
    return (int64_t)((std::string*)s)->size();
}

extern "C" void* ring_str_concat(void* a, void* b) {
    return (void*)new std::string(*(std::string*)a + *(std::string*)b);
}

extern "C" int64_t ring_str_eq(void* a, void* b) {
    CHK("str_eq");
    if (g_chk >= 9688 && g_chk <= 9702) {
        fprintf(stderr, "  str_eq(a=%p, b=%p)\n", a, b);
        fflush(stderr);
        if (a && b) {
            fprintf(stderr, "  str_eq(\"%s\", \"%s\")\n", ((std::string*)a)->c_str(), ((std::string*)b)->c_str());
            fflush(stderr);
        }
    }
    if (!a || !b) { fprintf(stderr, "FATAL: str_eq null ptr a=%p b=%p at chk %d\n", a, b, g_chk); fflush(stderr); return 0; }
    return (*(std::string*)a == *(std::string*)b) ? 1 : 0;
}

extern "C" int64_t ring_str_lt(void* a, void* b) {
    return (*(std::string*)a < *(std::string*)b) ? 1 : 0;
}

extern "C" void* ring_str_get(void* s, int64_t idx) {
    std::string* str = (std::string*)s;
    if (idx < 0 || idx >= (int64_t)str->size()) {
        fprintf(stderr, "ring panic: string index %lld out of bounds (len %lld)\n",
                (long long)idx, (long long)str->size());
        exit(1);
    }
    return (void*)new std::string(1, (*str)[(size_t)idx]);
}

extern "C" void* ring_str_slice(void* s, int64_t start, int64_t end) {
    std::string* str = (std::string*)s;
    if (start < 0) start = 0;
    if (end > (int64_t)str->size()) end = (int64_t)str->size();
    if (start >= end) return (void*)new std::string();
    return (void*)new std::string(str->substr((size_t)start, (size_t)(end - start)));
}

extern "C" int64_t ring_str_contains(void* s, void* sub) {
    return ((std::string*)s)->find(*(std::string*)sub) != std::string::npos ? 1 : 0;
}

extern "C" int64_t ring_str_starts_with(void* s, void* prefix) {
    std::string* str = (std::string*)s;
    std::string* pre = (std::string*)prefix;
    if (pre->size() > str->size()) return 0;
    return str->compare(0, pre->size(), *pre) == 0 ? 1 : 0;
}

extern "C" int64_t ring_str_ends_with(void* s, void* suffix) {
    std::string* str = (std::string*)s;
    std::string* suf = (std::string*)suffix;
    if (suf->size() > str->size()) return 0;
    return str->compare(str->size() - suf->size(), suf->size(), *suf) == 0 ? 1 : 0;
}

extern "C" void* ring_str_split(void* s, void* delim) {
    std::string* str = (std::string*)s;
    std::string* del = (std::string*)delim;
    auto* result = new std::vector<void*>();
    if (del->empty()) {
        // Split into individual characters
        for (size_t i = 0; i < str->size(); i++) {
            result->push_back((void*)new std::string(1, (*str)[i]));
        }
        return (void*)result;
    }
    size_t pos = 0, found;
    while ((found = str->find(*del, pos)) != std::string::npos) {
        result->push_back((void*)new std::string(str->substr(pos, found - pos)));
        pos = found + del->size();
    }
    result->push_back((void*)new std::string(str->substr(pos)));
    return (void*)result;
}

extern "C" void* ring_str_join(void* sep, void* list) {
    std::string* separator = (std::string*)sep;
    auto* vec = (std::vector<void*>*)list;
    auto* result = new std::string();
    for (size_t i = 0; i < vec->size(); i++) {
        if (i > 0) *result += *separator;
        *result += *(std::string*)((*vec)[i]);
    }
    return (void*)result;
}

extern "C" void* ring_str_replace(void* s, void* from, void* to) {
    std::string result = *(std::string*)s;
    std::string* f = (std::string*)from;
    std::string* t = (std::string*)to;
    if (f->empty()) return (void*)new std::string(result);
    size_t pos = 0;
    while ((pos = result.find(*f, pos)) != std::string::npos) {
        result.replace(pos, f->size(), *t);
        pos += t->size();
    }
    return (void*)new std::string(result);
}

extern "C" void* ring_int_to_str(int64_t val) {
    return (void*)new std::string(std::to_string(val));
}

extern "C" void* ring_float_to_str(double val) {
    return (void*)new std::string(std::to_string(val));
}

extern "C" void* ring_bool_to_str(int64_t val) {
    return (void*)new std::string(val ? "true" : "false");
}

// ============================================================================
// List (~18)
// ============================================================================

extern "C" void* ring_list_new() {
    CHK("list_new");
    return (void*)new std::vector<void*>();
}

extern "C" void* ring_list_push(void* list, void* val) {
    CHK("list_push");
    ((std::vector<void*>*)list)->push_back(val);
    return list;
}

// Validate that `p` is a readable List pointer; on failure report caller + value.
static void ring_check_list_ptr(void* p, const char* who, void* ret) {
    bool bad = false;
    if ((uintptr_t)p < 0x10000) bad = true;
    else {
        __try { volatile size_t s = ((std::vector<void*>*)p)->size(); (void)s; }
        __except(EXCEPTION_EXECUTE_HANDLER) { bad = true; }
    }
    if (bad) {
        HMODULE mod = GetModuleHandle(NULL);
        uintptr_t rva = (uintptr_t)ret - (uintptr_t)mod;
        fprintf(stderr, "FATAL: %s got invalid list ptr=%p at chk=%d caller_rva=0x%llx\n",
                who, p, g_chk, (unsigned long long)rva);
        fflush(stderr); dump_trace(); exit(1);
    }
}

extern "C" void* ring_list_get(void* list, int64_t idx) {
    CHK("list_get");
    ring_check_list_ptr(list, "ring_list_get", _ReturnAddress());
    auto* vec = (std::vector<void*>*)list;
    if (idx < 0 || idx >= (int64_t)vec->size()) {
        fprintf(stderr, "ring panic: list index %lld out of bounds (len %lld)\n",
                (long long)idx, (long long)vec->size());
        exit(1);
    }
    return (*vec)[(size_t)idx];
}

extern "C" void* ring_list_set(void* list, int64_t idx, void* val) {
    auto* vec = (std::vector<void*>*)list;
    if (idx < 0 || idx >= (int64_t)vec->size()) {
        fprintf(stderr, "ring panic: list index %lld out of bounds (len %lld)\n",
                (long long)idx, (long long)vec->size());
        exit(1);
    }
    (*vec)[(size_t)idx] = val;
    return list;
}

extern "C" int64_t ring_list_len(void* list) {
    CHK("list_len");
    if (!list) { return 0; }
    ring_check_list_ptr(list, "ring_list_len", _ReturnAddress());
    return (int64_t)((std::vector<void*>*)list)->size();
}

extern "C" void* ring_list_concat(void* a, void* b) {
    auto* va = (std::vector<void*>*)a;
    auto* vb = (std::vector<void*>*)b;
    auto* result = new std::vector<void*>(*va);
    result->insert(result->end(), vb->begin(), vb->end());
    return (void*)result;
}

extern "C" void* ring_list_slice(void* list, int64_t start, int64_t end) {
    auto* vec = (std::vector<void*>*)list;
    int64_t len = (int64_t)vec->size();
    if (start < 0) start = 0;
    if (end > len) end = len;
    if (start >= end) return (void*)new std::vector<void*>();
    return (void*)new std::vector<void*>(vec->begin() + start, vec->begin() + end);
}

extern "C" void* ring_list_pop(void* list) {
    auto* vec = (std::vector<void*>*)list;
    if (vec->empty()) {
        auto* opt = (int64_t*)malloc(sizeof(int64_t) * 2);
        opt[0] = 1; // None tag
        opt[1] = 0;
        return (void*)opt;
    }
    void* val = vec->back();
    vec->pop_back();
    auto* opt = (int64_t*)malloc(sizeof(int64_t) + sizeof(void*));
    opt[0] = 0; // Some tag
    *((void**)(opt + 1)) = val;
    return (void*)opt;
}

extern "C" int64_t ring_list_contains(void* list, void* val) {
    auto* vec = (std::vector<void*>*)list;
    for (size_t i = 0; i < vec->size(); i++) {
        if ((*vec)[i] == val) return 1;  // pointer comparison (bootstrap)
    }
    return 0;
}

extern "C" int64_t ring_list_index_of(void* list, void* val) {
    auto* vec = (std::vector<void*>*)list;
    for (size_t i = 0; i < vec->size(); i++) {
        if ((*vec)[i] == val) return (int64_t)i;  // pointer comparison
    }
    return -1;
}

extern "C" void* ring_list_get_opt(void* list, int64_t idx) {
    auto* vec = (std::vector<void*>*)list;
    if (idx < 0 || idx >= (int64_t)vec->size()) {
        return ring_enum_none();
    }
    return ring_enum_some((*vec)[(size_t)idx]);
}

extern "C" void* ring_list_reverse(void* list) {
    auto* vec = (std::vector<void*>*)list;
    auto* result = new std::vector<void*>(vec->rbegin(), vec->rend());
    return (void*)result;
}

extern "C" void* ring_list_sort(void* list, void* closure) {
    auto* vec = (std::vector<void*>*)list;
    auto* result = new std::vector<void*>(*vec);
    RingClosure* cmp = (RingClosure*)closure;
    ring_fn_2 fn = (ring_fn_2)(cmp->fn_ptr);
    std::sort(result->begin(), result->end(), [fn, cmp](void* a, void* b) -> bool {
        void* r = fn(cmp->env_ptr, a, b);
        return ring_unbox_int(r) < 0;
    });
    return (void*)result;
}

static void* ring_enum_some(void* val) {
    auto* opt = (int64_t*)malloc(sizeof(int64_t) + sizeof(void*));
    opt[0] = 0;
    *((void**)(opt + 1)) = val;
    return (void*)opt;
}

static void* ring_enum_none() {
    auto* opt = (int64_t*)malloc(sizeof(int64_t) * 2);
    opt[0] = 1;
    opt[1] = 0;
    return (void*)opt;
}

// ============================================================================
// Option methods
// Option layout: {tag: i64, payload: void*}  tag=0 → Some, tag=1 → None
// ============================================================================

extern "C" void* ring_Option_unwrap_or(void* opt, void* default_val) {
    int64_t tag = *(int64_t*)opt;
    if (tag == 0) return *((void**)((int64_t*)opt + 1));
    return default_val;
}

extern "C" void* ring_Option_unwrap(void* opt) {
    int64_t tag = *(int64_t*)opt;
    if (tag == 0) return *((void**)((int64_t*)opt + 1));
    fprintf(stderr, "ring panic: unwrap() called on None\n");
    exit(1);
    return nullptr;
}

extern "C" int64_t ring_Option_is_some(void* opt) {
    return *(int64_t*)opt == 0 ? 1 : 0;
}

extern "C" int64_t ring_Option_is_none(void* opt) {
    return *(int64_t*)opt == 1 ? 1 : 0;
}

extern "C" void* ring_Option_map(void* opt, void* closure) {
    int64_t tag = *(int64_t*)opt;
    if (tag == 0) {
        void* val = *((void**)((int64_t*)opt + 1));
        RingClosure* cl = (RingClosure*)closure;
        ring_fn_1 fn = (ring_fn_1)cl->fn_ptr;
        void* result = fn(cl->env_ptr, val);
        return ring_enum_some(result);
    }
    return ring_enum_none();
}

extern "C" void* ring_Option_unwrap_or_else(void* opt, void* closure) {
    int64_t tag = *(int64_t*)opt;
    if (tag == 0) return *((void**)((int64_t*)opt + 1));
    RingClosure* cl = (RingClosure*)closure;
    typedef void* (*ring_fn_0)(void* env);
    ring_fn_0 fn = (ring_fn_0)cl->fn_ptr;
    return fn(cl->env_ptr);
}

extern "C" void* ring_list_sort_default(void* list) {
    auto* vec = (std::vector<void*>*)list;
    auto* result = new std::vector<void*>(*vec);
    std::sort(result->begin(), result->end(), [](void* a, void* b) -> bool {
        return ring_unbox_int(a) < ring_unbox_int(b);
    });
    return (void*)result;
}

extern "C" int64_t ring_list_any(void* list, void* closure) {
    auto* vec = (std::vector<void*>*)list;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (size_t i = 0; i < vec->size(); i++) {
        void* r = fn(cls->env_ptr, (*vec)[i]);
        if (ring_unbox_int(r) != 0) return 1;
    }
    return 0;
}

extern "C" int64_t ring_list_all(void* list, void* closure) {
    auto* vec = (std::vector<void*>*)list;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (size_t i = 0; i < vec->size(); i++) {
        void* r = fn(cls->env_ptr, (*vec)[i]);
        if (ring_unbox_int(r) == 0) return 0;
    }
    return 1;
}

extern "C" void* ring_list_find(void* list, void* closure) {
    auto* vec = (std::vector<void*>*)list;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (size_t i = 0; i < vec->size(); i++) {
        void* r = fn(cls->env_ptr, (*vec)[i]);
        if (ring_unbox_int(r) != 0) {
            return ring_enum_some((*vec)[i]);
        }
    }
    return ring_enum_none();
}

extern "C" void* ring_list_map(void* list, void* closure) {
    if (!list) { return (void*)new std::vector<void*>(); }
    auto* vec = (std::vector<void*>*)list;
    auto* result = new std::vector<void*>();
    result->reserve(vec->size());
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (size_t i = 0; i < vec->size(); i++) {
        result->push_back(fn(cls->env_ptr, (*vec)[i]));
    }
    return (void*)result;
}

extern "C" void* ring_list_filter(void* list, void* closure) {
    auto* vec = (std::vector<void*>*)list;
    auto* result = new std::vector<void*>();
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (size_t i = 0; i < vec->size(); i++) {
        void* r = fn(cls->env_ptr, (*vec)[i]);
        if (ring_unbox_int(r) != 0) {
            result->push_back((*vec)[i]);
        }
    }
    return (void*)result;
}

extern "C" void* ring_list_for_each(void* list, void* closure) {
    auto* vec = (std::vector<void*>*)list;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (size_t i = 0; i < vec->size(); i++) {
        fn(cls->env_ptr, (*vec)[i]);
    }
    return nullptr;
}

extern "C" int64_t ring_list_is_empty(void* list) {
    return ((std::vector<void*>*)list)->empty() ? 1 : 0;
}

extern "C" void* ring_list_last(void* list) {
    auto* vec = (std::vector<void*>*)list;
    if (vec->empty()) {
        return ring_enum_none();
    }
    return ring_enum_some(vec->back());
}

extern "C" void* ring_list_first(void* list) {
    auto* vec = (std::vector<void*>*)list;
    if (vec->empty()) {
        return ring_enum_none();
    }
    return ring_enum_some(vec->front());
}

// ============================================================================
// Map (~10)
// ============================================================================

typedef std::unordered_map<std::string, void*> RingMap;
typedef std::unordered_map<int64_t, void*> RingMapInt;

extern "C" void* ring_map_new() {
    return (void*)new RingMap();
}

extern "C" void* ring_map_get(void* map, void* key) {
    RingMap* m = (RingMap*)map;
    std::string* k = (std::string*)key;
    auto it = m->find(*k);
    if (it == m->end()) {
        fprintf(stderr, "ring panic: map key not found: %s\n", k->c_str());
        exit(1);
    }
    return it->second;
}

extern "C" void* ring_map_get_opt(void* map, void* key) {
    RingMap* m = (RingMap*)map;
    std::string* k = (std::string*)key;
    auto it = m->find(*k);
    if (it == m->end()) return ring_enum_none();
    return ring_enum_some(it->second);
}

extern "C" void* ring_map_set(void* map, void* key, void* val) {
    CHK("map_set");
    RingMap* m = (RingMap*)map;
    (*m)[*(std::string*)key] = val;
    return map;
}

extern "C" int64_t ring_map_has(void* map, void* key) {
    RingMap* m = (RingMap*)map;
    return m->count(*(std::string*)key) > 0 ? 1 : 0;
}

extern "C" void* ring_map_delete(void* map, void* key) {
    RingMap* m = (RingMap*)map;
    m->erase(*(std::string*)key);
    return map;
}

extern "C" void* ring_map_keys(void* map) {
    RingMap* m = (RingMap*)map;
    auto* result = new std::vector<void*>();
    result->reserve(m->size());
    for (auto& kv : *m) {
        result->push_back((void*)new std::string(kv.first));
    }
    return (void*)result;
}

extern "C" void* ring_map_values(void* map) {
    RingMap* m = (RingMap*)map;
    auto* result = new std::vector<void*>();
    result->reserve(m->size());
    for (auto& kv : *m) {
        result->push_back(kv.second);
    }
    return (void*)result;
}

extern "C" void* ring_map_entries(void* map) {
    // Returns List of {key, value} pairs, each pair as a 2-element List
    RingMap* m = (RingMap*)map;
    auto* result = new std::vector<void*>();
    result->reserve(m->size());
    for (auto& kv : *m) {
        auto* pair = new std::vector<void*>();
        pair->push_back((void*)new std::string(kv.first));
        pair->push_back(kv.second);
        result->push_back((void*)pair);
    }
    return (void*)result;
}

extern "C" int64_t ring_map_len(void* map) {
    return (int64_t)((RingMap*)map)->size();
}

extern "C" void* ring_map_for_each(void* map, void* closure) {
    RingMap* m = (RingMap*)map;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_2 fn = (ring_fn_2)(cls->fn_ptr);
    for (auto& kv : *m) {
        fn(cls->env_ptr, (void*)new std::string(kv.first), kv.second);
    }
    return nullptr;
}

// ============================================================================
// Map<Int> — int64_t-keyed map
// ============================================================================

extern "C" void* ring_map_int_new() {
    return (void*)new RingMapInt();
}

extern "C" void* ring_map_int_get(void* map, void* key) {
    RingMapInt* m = (RingMapInt*)map;
    int64_t k = *(int64_t*)key;
    auto it = m->find(k);
    if (it == m->end()) {
        fprintf(stderr, "ring panic: map key not found: %lld\n", (long long)k);
        exit(1);
    }
    return it->second;
}

extern "C" void* ring_map_int_get_opt(void* map, void* key) {
    RingMapInt* m = (RingMapInt*)map;
    int64_t k = *(int64_t*)key;
    auto it = m->find(k);
    if (it == m->end()) return ring_enum_none();
    return ring_enum_some(it->second);
}

extern "C" void* ring_map_int_set(void* map, void* key, void* val) {
    CHK("map_int_set");
    RingMapInt* m = (RingMapInt*)map;
    int64_t k = *(int64_t*)key;
    (*m)[k] = val;
    return map;
}

extern "C" int64_t ring_map_int_has(void* map, void* key) {
    RingMapInt* m = (RingMapInt*)map;
    int64_t k = *(int64_t*)key;
    return m->count(k) > 0 ? 1 : 0;
}

extern "C" void* ring_map_int_delete(void* map, void* key) {
    RingMapInt* m = (RingMapInt*)map;
    int64_t k = *(int64_t*)key;
    m->erase(k);
    return map;
}

extern "C" void* ring_map_int_keys(void* map) {
    RingMapInt* m = (RingMapInt*)map;
    auto* result = new std::vector<void*>();
    result->reserve(m->size());
    for (auto& kv : *m) {
        result->push_back(ring_box_int(kv.first));
    }
    return (void*)result;
}

extern "C" void* ring_map_int_values(void* map) {
    RingMapInt* m = (RingMapInt*)map;
    auto* result = new std::vector<void*>();
    result->reserve(m->size());
    for (auto& kv : *m) {
        result->push_back(kv.second);
    }
    return (void*)result;
}

extern "C" void* ring_map_int_entries(void* map) {
    RingMapInt* m = (RingMapInt*)map;
    auto* result = new std::vector<void*>();
    result->reserve(m->size());
    for (auto& kv : *m) {
        auto* pair = new std::vector<void*>();
        pair->push_back(ring_box_int(kv.first));
        pair->push_back(kv.second);
        result->push_back((void*)pair);
    }
    return (void*)result;
}

extern "C" int64_t ring_map_int_len(void* map) {
    return (int64_t)((RingMapInt*)map)->size();
}

extern "C" void* ring_map_int_for_each(void* map, void* closure) {
    RingMapInt* m = (RingMapInt*)map;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_2 fn = (ring_fn_2)(cls->fn_ptr);
    for (auto& kv : *m) {
        fn(cls->env_ptr, ring_box_int(kv.first), kv.second);
    }
    return nullptr;
}

extern "C" void* ring_map_int_clone(void* map) {
    RingMapInt* m = (RingMapInt*)map;
    return (void*)new RingMapInt(*m);
}

extern "C" void* ring_map_int_from(void* entries) {
    auto* vec = (std::vector<void*>*)entries;
    auto* result = new RingMapInt();
    for (size_t i = 0; i < vec->size(); i++) {
        auto* pair = (std::vector<void*>*)((*vec)[i]);
        if (pair->size() >= 2) {
            int64_t key = *(int64_t*)((*pair)[0]);
            (*result)[key] = (*pair)[1];
        }
    }
    return (void*)result;
}

extern "C" void* ring_map_int_clear(void* map) {
    ((RingMapInt*)map)->clear();
    return map;
}

// ============================================================================
// Set (~8)
// ============================================================================

typedef std::unordered_set<std::string> RingSet;
typedef std::unordered_set<int64_t> RingSetInt;

extern "C" void* ring_set_new() {
    return (void*)new RingSet();
}

extern "C" void* ring_set_add(void* set, void* elem) {
    ((RingSet*)set)->insert(*(std::string*)elem);
    return set;
}

extern "C" int64_t ring_set_has(void* set, void* elem) {
    return ((RingSet*)set)->count(*(std::string*)elem) > 0 ? 1 : 0;
}

extern "C" void* ring_set_delete(void* set, void* elem) {
    ((RingSet*)set)->erase(*(std::string*)elem);
    return set;
}

extern "C" void* ring_set_to_list(void* set) {
    RingSet* s = (RingSet*)set;
    auto* result = new std::vector<void*>();
    result->reserve(s->size());
    for (auto& elem : *s) {
        result->push_back((void*)new std::string(elem));
    }
    return (void*)result;
}

extern "C" int64_t ring_set_len(void* set) {
    return (int64_t)((RingSet*)set)->size();
}

extern "C" void* ring_set_from_list(void* list) {
    auto* vec = (std::vector<void*>*)list;
    auto* result = new RingSet();
    for (size_t i = 0; i < vec->size(); i++) {
        result->insert(*(std::string*)((*vec)[i]));
    }
    return (void*)result;
}

extern "C" void* ring_set_for_each(void* set, void* closure) {
    RingSet* s = (RingSet*)set;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (auto& elem : *s) {
        fn(cls->env_ptr, (void*)new std::string(elem));
    }
    return nullptr;
}

// ============================================================================
// Set<Int> — int64_t-element set
// ============================================================================

extern "C" void* ring_set_int_new() {
    return (void*)new RingSetInt();
}

extern "C" void* ring_set_int_add(void* set, void* elem) {
    int64_t k = *(int64_t*)elem;
    ((RingSetInt*)set)->insert(k);
    return set;
}

extern "C" int64_t ring_set_int_has(void* set, void* elem) {
    int64_t k = *(int64_t*)elem;
    return ((RingSetInt*)set)->count(k) > 0 ? 1 : 0;
}

extern "C" void* ring_set_int_delete(void* set, void* elem) {
    int64_t k = *(int64_t*)elem;
    ((RingSetInt*)set)->erase(k);
    return set;
}

extern "C" void* ring_set_int_to_list(void* set) {
    RingSetInt* s = (RingSetInt*)set;
    auto* result = new std::vector<void*>();
    result->reserve(s->size());
    for (auto& elem : *s) {
        result->push_back(ring_box_int(elem));
    }
    return (void*)result;
}

extern "C" int64_t ring_set_int_len(void* set) {
    return (int64_t)((RingSetInt*)set)->size();
}

extern "C" void* ring_set_int_from_list(void* list) {
    auto* vec = (std::vector<void*>*)list;
    auto* result = new RingSetInt();
    for (size_t i = 0; i < vec->size(); i++) {
        int64_t k = *(int64_t*)((*vec)[i]);
        result->insert(k);
    }
    return (void*)result;
}

extern "C" void* ring_set_int_for_each(void* set, void* closure) {
    RingSetInt* s = (RingSetInt*)set;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (auto& elem : *s) {
        fn(cls->env_ptr, ring_box_int(elem));
    }
    return nullptr;
}

extern "C" void* ring_set_int_clone(void* set) {
    RingSetInt* s = (RingSetInt*)set;
    return (void*)new RingSetInt(*s);
}

extern "C" void* ring_set_int_union(void* a, void* b) {
    RingSetInt* sa = (RingSetInt*)a;
    RingSetInt* sb = (RingSetInt*)b;
    auto* result = new RingSetInt(*sa);
    for (auto& elem : *sb) {
        result->insert(elem);
    }
    return (void*)result;
}

extern "C" void* ring_set_int_intersect(void* a, void* b) {
    RingSetInt* sa = (RingSetInt*)a;
    RingSetInt* sb = (RingSetInt*)b;
    auto* result = new RingSetInt();
    for (auto& elem : *sa) {
        if (sb->count(elem) > 0) {
            result->insert(elem);
        }
    }
    return (void*)result;
}

extern "C" void* ring_set_int_difference(void* a, void* b) {
    RingSetInt* sa = (RingSetInt*)a;
    RingSetInt* sb = (RingSetInt*)b;
    auto* result = new RingSetInt();
    for (auto& elem : *sa) {
        if (sb->count(elem) == 0) {
            result->insert(elem);
        }
    }
    return (void*)result;
}

extern "C" void* ring_set_int_clear(void* set) {
    ((RingSetInt*)set)->clear();
    return set;
}

// ============================================================================
// Type sanitization (LLVM codegen workaround)
// ============================================================================

// ring_sanitize_type: workaround for LLVM codegen List<Type>-as-Type bug.
// If the value is not a valid Type enum (tag outside 0..15) but looks like
// a std::vector, return its first element instead.
extern "C" void* ring_sanitize_type(void* t) {
    if (!t) return t;
    int64_t tag = *(int64_t*)t;
    if (tag >= 0 && tag <= 15) return t;
    __try {
        auto* vec = (std::vector<void*>*)t;
        if (vec->size() > 0) {
            void* first = (*vec)[0];
            if (first) {
                int64_t ftag = *(int64_t*)first;
                if (ftag >= 0 && ftag <= 15) return first;
            }
        }
    } __except(EXCEPTION_EXECUTE_HANDLER) {}
    return t;
}

// ring_debug_verify_type: fallback diagnostic — panics if a Type value has
// an invalid tag (called from match.default blocks in enum match codegen).
extern "C" void* ring_debug_verify_type(void* t) {
    if (!t) {
        fprintf(stderr, "VERIFY: null Type pointer at chk=%d\n", g_chk);
        fflush(stderr); dump_trace(); exit(99);
    }
    int64_t tag = *(int64_t*)t;
    if (tag < 0 || tag > 15) {
        fprintf(stderr, "VERIFY: bad Type tag=%lld (0x%llx) ptr=%p at chk=%d\n",
                (long long)tag, (unsigned long long)tag, t, g_chk);
        fflush(stderr); dump_trace(); exit(99);
    }
    if (tag == 7) { // TypeVar
        void* id = ((void**)t)[1];
        if (!id) {
            fprintf(stderr, "VERIFY: TypeVar null id at chk=%d ptr=%p\n", g_chk, t);
            void** data = (void**)t;
            fprintf(stderr, "  TypeVar data: tag=%lld id=%p name=%p\n",
                    (long long)data[0], data[1], data[2]);
            fflush(stderr); dump_trace(); exit(99);
        }
    }
    return t;
}

// ============================================================================
// IO / FS / Process (~8)
// ============================================================================

extern "C" void* ring_debug_assert_nonnull(void* ptr, void* msg) {
    if (ptr == nullptr) {
        fprintf(stderr, "ASSERT_NONNULL FAILED: %s (chk=%d)\n",
                msg ? ((std::string*)msg)->c_str() : "(no msg)", g_chk);
        fflush(stderr);
        dump_trace();
        exit(99);
    }
    return ptr;
}

extern "C" void* ring_print(void* s) {
    CHK("PRINT");
    fprintf(stderr, "[RING_PRINT] %s\n", ((std::string*)s)->c_str());
    printf("%s\n", ((std::string*)s)->c_str());
    fflush(stdout);
    fflush(stderr);
    return nullptr;
}

extern "C" void* ring_eprintln(void* s) {
    CHK("EPRINTLN");
    fprintf(stderr, "[RING_EPRINTLN] %s\n", ((std::string*)s)->c_str());
    fflush(stderr);
    return nullptr;
}

extern "C" void* ring_panic(void* s) {
    CHK("PANIC");
    if (s) {
        fprintf(stderr, "ring panic: %s\n", ((std::string*)s)->c_str());
    } else {
        fprintf(stderr, "ring panic: (null message)\n");
    }
    fflush(stderr);
    exit(1);
    return nullptr;  // unreachable
}

// Diagnostic for non-exhaustive enum match: a value reached a match whose tag
// matched no arm. Reports the enum name (known at codegen) and the runtime tag.
extern "C" void* ring_match_fail(void* enum_name, int64_t tag, int64_t site, void* scrut) {
    fprintf(stderr, "ring panic: non-exhaustive match on enum '%s' (runtime tag=%lld, site #%lld)\n",
            enum_name ? ((std::string*)enum_name)->c_str() : "?",
            (long long)tag, (long long)site);
    // If the "tag" looks like a heap pointer, the scrutinee is probably a
    // miscompiled value. Try to introspect it as a std::vector and dump shape.
    if (tag > 0xffff) {
        __try {
            auto* vec = (std::vector<void*>*)scrut;
            size_t n = vec->size();
            fprintf(stderr, "  scrut looks like a List: size=%zu\n", n);
            for (size_t i = 0; i < n && i < 6; i++) {
                void* e = (*vec)[i];
                int64_t etag = e ? *(int64_t*)e : -1;
                fprintf(stderr, "    [%zu] ptr=%p tag=%lld\n", i, e, (long long)etag);
            }
        } __except(EXCEPTION_EXECUTE_HANDLER) {
            fprintf(stderr, "  (scrut not a readable vector)\n");
        }
    }
    fflush(stderr);
    dump_trace();
    exit(1);
    return nullptr;  // unreachable
}

extern "C" void* ring_read_file(void* path) {
    std::string* p = (std::string*)path;
    FILE* f = fopen(p->c_str(), "rb");
    if (!f) {
        fprintf(stderr, "ring panic: cannot open file: %s\n", p->c_str());
        exit(1);
    }
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    auto* result = new std::string((size_t)size, '\0');
    fread(&(*result)[0], 1, (size_t)size, f);
    fclose(f);
    return (void*)result;
}

extern "C" void* ring_write_file(void* path, void* content) {
    std::string* p = (std::string*)path;
    std::string* c = (std::string*)content;
    FILE* f = fopen(p->c_str(), "wb");
    if (!f) {
        fprintf(stderr, "ring panic: cannot write file: %s\n", p->c_str());
        exit(1);
    }
    fwrite(c->data(), 1, c->size(), f);
    fclose(f);
    return nullptr;
}

extern "C" void* ring_exit(void* boxed_code) {
    int64_t code = *(int64_t*)boxed_code;
    fprintf(stderr, "[RING_EXIT] code=%lld\n", (long long)code);
    fflush(stderr);
    exit((int)code);
    return nullptr;  // unreachable
}

extern "C" void* ring_args() {
    auto* result = new std::vector<void*>();
    // Skip argv[0] (program name) to match JS backend behavior
    // where process.argv.slice(2) skips [node, script]
    for (int i = 1; i < g_argc; i++) {
        result->push_back((void*)new std::string(g_argv[i]));
    }
    return (void*)result;
}

extern "C" void* ring_cwd() {
    char buf[4096];
#ifdef _WIN32
    if (_getcwd(buf, sizeof(buf)) == nullptr) {
#else
    if (getcwd(buf, sizeof(buf)) == nullptr) {
#endif
        fprintf(stderr, "ring panic: getcwd failed\n");
        exit(1);
    }
    return (void*)new std::string(buf);
}

// ============================================================================
// StringBuilder (~4)
// ============================================================================

extern "C" void* ring_sb_new() {
    return (void*)new std::string();
}

extern "C" void* ring_sb_add(void* sb, void* s) {
    *(std::string*)sb += *(std::string*)s;
    return sb;
}

extern "C" void* ring_sb_to_str(void* sb) {
    return (void*)new std::string(*(std::string*)sb);
}

extern "C" int64_t ring_sb_len(void* sb) {
    return (int64_t)((std::string*)sb)->size();
}

// ============================================================================
// setjmp/longjmp — fail effect handler stack (~5)
// ============================================================================

struct RingCatchFrame {
    jmp_buf buf;
    void* error_value;
    RingCatchFrame* prev;
};

#ifdef _WIN32
__declspec(thread) static RingCatchFrame* ring_catch_stack = nullptr;
#else
thread_local RingCatchFrame* ring_catch_stack = nullptr;
#endif

extern "C" void* ring_catch_push() {
    RingCatchFrame* frame = new RingCatchFrame();
    frame->error_value = nullptr;
    frame->prev = ring_catch_stack;
    ring_catch_stack = frame;
    return (void*)frame;
}

extern "C" int64_t ring_catch_setjmp(void* frame_ptr) {
    RingCatchFrame* frame = (RingCatchFrame*)frame_ptr;
    return (int64_t)setjmp(frame->buf);
}

extern "C" void ring_raise(void* error) {
    if (!ring_catch_stack) {
        fprintf(stderr, "ring panic: unhandled effect raise (no catch frame)\n");
        exit(1);
    }
    RingCatchFrame* frame = ring_catch_stack;
    frame->error_value = error;
    longjmp(frame->buf, 1);
}

extern "C" void* __ring_raise_fail(void* msg) {
    ring_raise(msg);
    return nullptr;
}

extern "C" void* ring_catch_get_error(void* frame_ptr) {
    return ((RingCatchFrame*)frame_ptr)->error_value;
}

extern "C" void ring_catch_pop() {
    RingCatchFrame* frame = ring_catch_stack;
    ring_catch_stack = frame->prev;
    delete frame;
}

// ring_try: correct setjmp/longjmp scoping for `body catch { arms }`.
// The catch frame and setjmp live in THIS function's stack frame, and the body
// closure is invoked nested from here — so a longjmp (from a deeply-nested
// fail.raise) returns into a frame that is still live, unlike a setjmp performed
// inside a wrapper that has already returned.
//   body_cl  : closure {fn(env)->ptr, env}
//   catch_cl : closure {fn(env, error)->ptr, env}
extern "C" void* ring_try(void* body_cl, void* catch_cl) {
    RingCatchFrame frame;
    frame.error_value = nullptr;
    frame.prev = ring_catch_stack;
    ring_catch_stack = &frame;
    void** bc = (void**)body_cl;
    void** cc = (void**)catch_cl;
    if (setjmp(frame.buf) == 0) {
        void* (*bfn)(void*) = (void* (*)(void*))bc[0];
        void* result = bfn(bc[1]);
        ring_catch_stack = frame.prev;   // normal completion: pop
        return result;
    } else {
        ring_catch_stack = frame.prev;   // caught: pop, then run catch arm
        void* err = frame.error_value;
        void* (*cfn)(void*, void*) = (void* (*)(void*, void*))cc[0];
        return cfn(cc[1], err);
    }
}

// ============================================================================
// Path operations (~5)
// ============================================================================

extern "C" void* ring_path_join(void* a, void* b) {
    std::string* sa = (std::string*)a;
    std::string* sb = (std::string*)b;
    if (sa->empty()) return (void*)new std::string(*sb);
    if (sb->empty()) return (void*)new std::string(*sa);
    char last = sa->back();
    if (last == '/' || last == '\\') {
        return (void*)new std::string(*sa + *sb);
    }
    return (void*)new std::string(*sa + PATH_SEP + *sb);
}

extern "C" void* ring_path_resolve(void* p) {
    std::string* sp = (std::string*)p;
#ifdef _WIN32
    char buf[4096];
    DWORD len = GetFullPathNameA(sp->c_str(), sizeof(buf), buf, nullptr);
    if (len == 0 || len >= sizeof(buf)) {
        return (void*)new std::string(*sp);
    }
    return (void*)new std::string(buf);
#else
    char* resolved = realpath(sp->c_str(), nullptr);
    if (!resolved) {
        return (void*)new std::string(*sp);
    }
    auto* result = new std::string(resolved);
    free(resolved);
    return (void*)result;
#endif
}

extern "C" void* ring_path_dirname(void* p) {
    std::string* sp = (std::string*)p;
    size_t pos = sp->find_last_of("/\\");
    if (pos == std::string::npos) return (void*)new std::string(".");
    return (void*)new std::string(sp->substr(0, pos));
}

extern "C" void* ring_path_basename(void* p) {
    std::string* sp = (std::string*)p;
    size_t pos = sp->find_last_of("/\\");
    if (pos == std::string::npos) return (void*)new std::string(*sp);
    return (void*)new std::string(sp->substr(pos + 1));
}

extern "C" void* ring_path_extname(void* p) {
    std::string* sp = (std::string*)p;
    size_t slash = sp->find_last_of("/\\");
    size_t dot = sp->rfind('.');
    if (dot == std::string::npos || (slash != std::string::npos && dot < slash)) {
        return (void*)new std::string("");
    }
    return (void*)new std::string(sp->substr(dot));
}

// ============================================================================
// File operations (additional)
// ============================================================================

extern "C" void* ring_file_exists(void* path) {
    std::string* p = (std::string*)path;
#ifdef _WIN32
    int64_t exists = _access(p->c_str(), 0) == 0 ? 1 : 0;
#else
    int64_t exists = access(p->c_str(), F_OK) == 0 ? 1 : 0;
#endif
    return ring_box_bool(exists);
}

extern "C" void* ring_delete_file(void* path) {
    std::string* p = (std::string*)path;
    remove(p->c_str());
    return nullptr;
}

// ============================================================================
// Collection clone / from
// ============================================================================

extern "C" void* ring_list_clone(void* list) {
    auto* vec = (std::vector<void*>*)list;
    return (void*)new std::vector<void*>(*vec);
}

extern "C" void* ring_map_clone(void* map) {
    RingMap* m = (RingMap*)map;
    return (void*)new RingMap(*m);
}

extern "C" void* ring_set_clone(void* set) {
    RingSet* s = (RingSet*)set;
    return (void*)new RingSet(*s);
}

extern "C" void* ring_map_from(void* entries) {
    // entries is List<(K, V)> = List<List<void*>> where each inner list is [key, value]
    auto* vec = (std::vector<void*>*)entries;
    auto* result = new RingMap();
    for (size_t i = 0; i < vec->size(); i++) {
        auto* pair = (std::vector<void*>*)((*vec)[i]);
        if (pair->size() >= 2) {
            std::string* key = (std::string*)((*pair)[0]);
            (*result)[*key] = (*pair)[1];
        }
    }
    return (void*)result;
}

// ring_set_from_list already defined above

// ============================================================================
// String operations (additional)
// ============================================================================

extern "C" void* ring_str_trim(void* s) {
    std::string* str = (std::string*)s;
    size_t start = str->find_first_not_of(" \t\n\r\f\v");
    size_t end = str->find_last_not_of(" \t\n\r\f\v");
    if (start == std::string::npos) return (void*)new std::string("");
    return (void*)new std::string(str->substr(start, end - start + 1));
}

extern "C" void* ring_str_trim_start(void* s) {
    std::string* str = (std::string*)s;
    size_t start = str->find_first_not_of(" \t\n\r\f\v");
    if (start == std::string::npos) return (void*)new std::string("");
    return (void*)new std::string(str->substr(start));
}

extern "C" void* ring_str_trim_end(void* s) {
    std::string* str = (std::string*)s;
    size_t end = str->find_last_not_of(" \t\n\r\f\v");
    if (end == std::string::npos) return (void*)new std::string("");
    return (void*)new std::string(str->substr(0, end + 1));
}

extern "C" void* ring_str_to_upper(void* s) {
    std::string result = *(std::string*)s;
    for (size_t i = 0; i < result.size(); i++) {
        result[i] = (char)toupper((unsigned char)result[i]);
    }
    return (void*)new std::string(result);
}

extern "C" void* ring_str_to_lower(void* s) {
    std::string result = *(std::string*)s;
    for (size_t i = 0; i < result.size(); i++) {
        result[i] = (char)tolower((unsigned char)result[i]);
    }
    return (void*)new std::string(result);
}

extern "C" void* ring_str_char_at(void* s, int64_t idx) {
    std::string* str = (std::string*)s;
    if (idx < 0 || idx >= (int64_t)str->size()) {
        // Return Option::none — tag=1, no payload
        // Option struct: {i64 tag, void* payload}
        auto* opt = (int64_t*)malloc(sizeof(int64_t) * 2);
        opt[0] = 1; // none tag
        opt[1] = 0;
        return (void*)opt;
    }
    // Return Option::some(char_str) — tag=0
    auto* ch = new std::string(1, (*str)[(size_t)idx]);
    auto* opt = (int64_t*)malloc(sizeof(int64_t) + sizeof(void*));
    opt[0] = 0; // some tag
    *((void**)(opt + 1)) = (void*)ch;
    return (void*)opt;
}

extern "C" void* ring_str_index_of(void* s, void* sub) {
    std::string* str = (std::string*)s;
    std::string* needle = (std::string*)sub;
    size_t pos = str->find(*needle);
    if (pos == std::string::npos) {
        // Return Option::none
        auto* opt = (int64_t*)malloc(sizeof(int64_t) * 2);
        opt[0] = 1; // none
        opt[1] = 0;
        return (void*)opt;
    }
    // Return Option::some(index)
    auto* boxed = (int64_t*)malloc(sizeof(int64_t));
    *boxed = (int64_t)pos;
    auto* opt = (int64_t*)malloc(sizeof(int64_t) + sizeof(void*));
    opt[0] = 0; // some
    *((void**)(opt + 1)) = (void*)boxed;
    return (void*)opt;
}

extern "C" void* ring_str_last_index_of(void* s, void* sub) {
    std::string* str = (std::string*)s;
    std::string* needle = (std::string*)sub;
    size_t pos = str->rfind(*needle);
    if (pos == std::string::npos) {
        auto* opt = (int64_t*)malloc(sizeof(int64_t) * 2);
        opt[0] = 1;
        opt[1] = 0;
        return (void*)opt;
    }
    auto* boxed = (int64_t*)malloc(sizeof(int64_t));
    *boxed = (int64_t)pos;
    auto* opt = (int64_t*)malloc(sizeof(int64_t) + sizeof(void*));
    opt[0] = 0;
    *((void**)(opt + 1)) = (void*)boxed;
    return (void*)opt;
}

extern "C" int64_t ring_str_is_empty(void* s) {
    return ((std::string*)s)->empty() ? 1 : 0;
}

extern "C" void* ring_str_pad_start(void* s, int64_t length, void* fill) {
    std::string* str = (std::string*)s;
    std::string* filler = (std::string*)fill;
    if ((int64_t)str->size() >= length || filler->empty()) {
        return (void*)new std::string(*str);
    }
    std::string result;
    while ((int64_t)(result.size() + str->size()) < length) {
        result += *filler;
    }
    result = result.substr(0, (size_t)(length - (int64_t)str->size()));
    result += *str;
    return (void*)new std::string(result);
}

extern "C" void* ring_str_pad_end(void* s, int64_t length, void* fill) {
    std::string* str = (std::string*)s;
    std::string* filler = (std::string*)fill;
    if ((int64_t)str->size() >= length || filler->empty()) {
        return (void*)new std::string(*str);
    }
    std::string result = *str;
    while ((int64_t)result.size() < length) {
        result += *filler;
    }
    return (void*)new std::string(result.substr(0, (size_t)length));
}

extern "C" void* ring_str_repeat(void* s, int64_t count) {
    std::string* str = (std::string*)s;
    std::string result;
    for (int64_t i = 0; i < count; i++) {
        result += *str;
    }
    return (void*)new std::string(result);
}

extern "C" void* ring_str_char_code_at(void* s, int64_t idx) {
    CHK("str_char_code_at");
    std::string* str = (std::string*)s;
    if (idx < 0 || idx >= (int64_t)str->size()) {
        auto* opt = (int64_t*)malloc(sizeof(int64_t) * 2);
        opt[0] = 1;
        opt[1] = 0;
        return (void*)opt;
    }
    auto* boxed = (int64_t*)malloc(sizeof(int64_t));
    *boxed = (int64_t)(unsigned char)(*str)[(size_t)idx];
    auto* opt = (int64_t*)malloc(sizeof(int64_t) + sizeof(void*));
    opt[0] = 0;
    *((void**)(opt + 1)) = (void*)boxed;
    return (void*)opt;
}

// ============================================================================
// StringBuilder (additional)
// ============================================================================

extern "C" void* ring_sb_line(void* sb, void* s) {
    *(std::string*)sb += *(std::string*)s;
    *(std::string*)sb += "\n";
    return sb;
}

extern "C" void* ring_sb_add_int(void* sb, int64_t n) {
    *(std::string*)sb += std::to_string(n);
    return sb;
}

// ============================================================================
// Parse functions
// ============================================================================

extern "C" void* ring_parse_int(void* s) {
    std::string* str = (std::string*)s;
    try {
        size_t pos;
        int64_t val = std::stoll(*str, &pos);
        if (pos == str->size()) {
            // Return Option::some(boxed_int)
            auto* boxed = (int64_t*)malloc(sizeof(int64_t));
            *boxed = val;
            auto* opt = (int64_t*)malloc(sizeof(int64_t) + sizeof(void*));
            opt[0] = 0;
            *((void**)(opt + 1)) = (void*)boxed;
            return (void*)opt;
        }
    } catch (...) {}
    // Return Option::none
    auto* opt = (int64_t*)malloc(sizeof(int64_t) * 2);
    opt[0] = 1;
    opt[1] = 0;
    return (void*)opt;
}

extern "C" void* ring_parse_float(void* s) {
    std::string* str = (std::string*)s;
    try {
        size_t pos;
        double val = std::stod(*str, &pos);
        if (pos == str->size()) {
            auto* boxed = (double*)malloc(sizeof(double));
            *boxed = val;
            auto* opt = (int64_t*)malloc(sizeof(int64_t) + sizeof(void*));
            opt[0] = 0;
            *((void**)(opt + 1)) = (void*)boxed;
            return (void*)opt;
        }
    } catch (...) {}
    auto* opt = (int64_t*)malloc(sizeof(int64_t) * 2);
    opt[0] = 1;
    opt[1] = 0;
    return (void*)opt;
}

// ============================================================================
// Set operations (additional)
// ============================================================================

extern "C" void* ring_set_union(void* a, void* b) {
    RingSet* sa = (RingSet*)a;
    RingSet* sb = (RingSet*)b;
    auto* result = new RingSet(*sa);
    for (auto& elem : *sb) {
        result->insert(elem);
    }
    return (void*)result;
}

extern "C" void* ring_set_intersect(void* a, void* b) {
    RingSet* sa = (RingSet*)a;
    RingSet* sb = (RingSet*)b;
    auto* result = new RingSet();
    for (auto& elem : *sa) {
        if (sb->count(elem) > 0) {
            result->insert(elem);
        }
    }
    return (void*)result;
}

extern "C" void* ring_set_difference(void* a, void* b) {
    RingSet* sa = (RingSet*)a;
    RingSet* sb = (RingSet*)b;
    auto* result = new RingSet();
    for (auto& elem : *sa) {
        if (sb->count(elem) == 0) {
            result->insert(elem);
        }
    }
    return (void*)result;
}

// ============================================================================
// List operations (additional)
// ============================================================================

extern "C" void* ring_list_shift(void* list) {
    auto* vec = (std::vector<void*>*)list;
    if (vec->empty()) {
        // Return Option::none
        auto* opt = (int64_t*)malloc(sizeof(int64_t) * 2);
        opt[0] = 1;
        opt[1] = 0;
        return (void*)opt;
    }
    void* val = vec->front();
    vec->erase(vec->begin());
    // Return Option::some(val)
    auto* opt = (int64_t*)malloc(sizeof(int64_t) + sizeof(void*));
    opt[0] = 0;
    *((void**)(opt + 1)) = val;
    return (void*)opt;
}

extern "C" void* ring_list_clear(void* list) {
    ((std::vector<void*>*)list)->clear();
    return list;
}

extern "C" void* ring_list_extend(void* list, void* other) {
    auto* va = (std::vector<void*>*)list;
    auto* vb = (std::vector<void*>*)other;
    va->insert(va->end(), vb->begin(), vb->end());
    return list;
}

// ============================================================================
// Map operations (additional)
// ============================================================================

extern "C" void* ring_map_clear(void* map) {
    ((RingMap*)map)->clear();
    return map;
}

// ============================================================================
// Set operations (additional clear/remove)
// ============================================================================

extern "C" void* ring_set_clear(void* set) {
    ((RingSet*)set)->clear();
    return set;
}

// ============================================================================
// Miscellaneous
// ============================================================================

extern "C" void* ring_assert(int64_t cond, void* msg) {
    if (!cond) {
        fprintf(stderr, "ring assertion failed: %s\n", ((std::string*)msg)->c_str());
        fflush(stderr);
        exit(1);
    }
    return nullptr;
}

// JSON-stringify a value. The bootstrap compiler only ever calls this on Str
// (to emit JS string literals), so the value is treated as a std::string and
// rendered as a quoted, escaped JSON string. (General <T> serialization would
// require runtime type tags, which the uniform-boxing runtime does not carry.)
extern "C" void* ring_json_stringify(void* val) {
    if (!val) return (void*)new std::string("null");
    std::string* s = (std::string*)val;
    std::string out = "\"";
    for (unsigned char c : *s) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            case '\b': out += "\\b"; break;
            case '\f': out += "\\f"; break;
            default:
                if (c < 0x20) {
                    char buf[8];
                    snprintf(buf, sizeof(buf), "\\u%04x", c);
                    out += buf;
                } else {
                    out += (char)c;
                }
        }
    }
    out += "\"";
    return (void*)new std::string(out);
}

// ============================================================================
// Builtin primitive trait dictionaries (Eq for Str/Int/Float/Bool).
// The bootstrap LLVM backend does not emit Ring impls for primitive Eq, so a
// generic `x == item` (which dispatches through an Eq dict) needs a real dict.
// Each dict is { eq_closure, ne_closure, null, null }; each closure is
// { fn_ptr, null_env }; the closure ABI is fn(env, a, b) -> boxed value.
// ============================================================================

extern "C" void* ring_cl_eq_str(void* env, void* a, void* b) { return ring_box_bool(ring_str_eq(a, b)); }
extern "C" void* ring_cl_ne_str(void* env, void* a, void* b) { return ring_box_bool(ring_str_eq(a, b) ? 0 : 1); }
extern "C" void* ring_cl_eq_int(void* env, void* a, void* b) { return ring_box_bool((*(int64_t*)a == *(int64_t*)b) ? 1 : 0); }
extern "C" void* ring_cl_ne_int(void* env, void* a, void* b) { return ring_box_bool((*(int64_t*)a == *(int64_t*)b) ? 0 : 1); }
extern "C" void* ring_cl_eq_float(void* env, void* a, void* b) { return ring_box_bool((*(double*)a == *(double*)b) ? 1 : 0); }
extern "C" void* ring_cl_ne_float(void* env, void* a, void* b) { return ring_box_bool((*(double*)a == *(double*)b) ? 0 : 1); }
extern "C" void* ring_cl_eq_bool(void* env, void* a, void* b) { return ring_box_bool((*(int64_t*)a == *(int64_t*)b) ? 1 : 0); }
extern "C" void* ring_cl_ne_bool(void* env, void* a, void* b) { return ring_box_bool((*(int64_t*)a == *(int64_t*)b) ? 0 : 1); }
// Tag comparison for enum Eq dicts (correct for field-less enum variants, which
// is what the bootstrap compiler compares with `==`). Reads the leading i64 tag.
extern "C" void* ring_cl_eq_tag(void* env, void* a, void* b) {
    if (!a || !b) return ring_box_bool((a == b) ? 1 : 0);
    return ring_box_bool((*(int64_t*)a == *(int64_t*)b) ? 1 : 0);
}
extern "C" void* ring_cl_ne_tag(void* env, void* a, void* b) {
    if (!a || !b) return ring_box_bool((a == b) ? 0 : 1);
    return ring_box_bool((*(int64_t*)a == *(int64_t*)b) ? 0 : 1);
}

static void* ring_make_closure(void* fn) {
    void** c = (void**)malloc(2 * sizeof(void*));
    c[0] = fn; c[1] = nullptr;
    return (void*)c;
}
static void* ring_make_eq_dict(void* eqfn, void* nefn) {
    void** d = (void**)malloc(4 * sizeof(void*));
    d[0] = ring_make_closure(eqfn);
    d[1] = ring_make_closure(nefn);
    d[2] = nullptr; d[3] = nullptr;
    return (void*)d;
}

extern "C" void* ring_get_builtin_dict(void* name_ptr) {
    if (!name_ptr) return nullptr;
    std::string& n = *(std::string*)name_ptr;
    // Only Eq dicts are constructed here (eq/ne). Ord dicts are not yet supported.
    if (n.find("Eq") != std::string::npos) {
        if (n.find("Str") != std::string::npos)   return ring_make_eq_dict((void*)ring_cl_eq_str,   (void*)ring_cl_ne_str);
        if (n.find("Float") != std::string::npos) return ring_make_eq_dict((void*)ring_cl_eq_float, (void*)ring_cl_ne_float);
        if (n.find("Int") != std::string::npos)   return ring_make_eq_dict((void*)ring_cl_eq_int,   (void*)ring_cl_ne_int);
        if (n.find("Bool") != std::string::npos)  return ring_make_eq_dict((void*)ring_cl_eq_bool,  (void*)ring_cl_ne_bool);
        // Any other Eq dict (user enums) → tag comparison.
        return ring_make_eq_dict((void*)ring_cl_eq_tag, (void*)ring_cl_ne_tag);
    }
    fprintf(stderr, "ring: no builtin dict for '%s'\n", n.c_str());
    fflush(stderr);
    return nullptr;
}

// ============================================================================
// List operations (join already defined as ring_list_join)
// ============================================================================

extern "C" void* ring_list_join(void* list, void* sep) {
    auto* vec = (std::vector<void*>*)list;
    std::string* separator = (std::string*)sep;
    auto* result = new std::string();
    for (size_t i = 0; i < vec->size(); i++) {
        if (i > 0) *result += *separator;
        *result += *(std::string*)((*vec)[i]);
    }
    return (void*)result;
}
