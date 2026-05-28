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
//   Set          = std::unordered_set<std::string>*
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

extern "C" void ring_runtime_init(int argc, char** argv) {
    g_argc = argc;
    g_argv = argv;
}

// ============================================================================
// Boxing / Unboxing (6)
// ============================================================================

extern "C" void* ring_box_int(int64_t val) {
    int64_t* p = (int64_t*)malloc(sizeof(int64_t));
    *p = val;
    return (void*)p;
}

extern "C" int64_t ring_unbox_int(void* p) {
    return *(int64_t*)p;
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
    int64_t* p = (int64_t*)malloc(sizeof(int64_t));
    *p = (val != 0) ? 1 : 0;
    return (void*)p;
}

extern "C" int64_t ring_unbox_bool(void* p) {
    return *(int64_t*)p;
}

// ============================================================================
// Str (~15)
// ============================================================================

extern "C" void* ring_str_new() {
    return (void*)new std::string();
}

extern "C" void* ring_str_from_cstr(const char* cstr) {
    return (void*)new std::string(cstr);
}

extern "C" int64_t ring_str_len(void* s) {
    return (int64_t)((std::string*)s)->size();
}

extern "C" void* ring_str_concat(void* a, void* b) {
    return (void*)new std::string(*(std::string*)a + *(std::string*)b);
}

extern "C" int64_t ring_str_eq(void* a, void* b) {
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
    return (void*)new std::vector<void*>();
}

extern "C" void* ring_list_push(void* list, void* val) {
    ((std::vector<void*>*)list)->push_back(val);
    return list;
}

extern "C" void* ring_list_get(void* list, int64_t idx) {
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
        fprintf(stderr, "ring panic: pop on empty list\n");
        exit(1);
    }
    void* val = vec->back();
    vec->pop_back();
    return val;
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

extern "C" void* ring_list_sort_default(void* list) {
    auto* vec = (std::vector<void*>*)list;
    auto* result = new std::vector<void*>(*vec);
    std::sort(result->begin(), result->end(), [](void* a, void* b) -> bool {
        return ring_unbox_int(a) < ring_unbox_int(b);
    });
    return (void*)result;
}

extern "C" void* ring_list_any(void* list, void* closure) {
    auto* vec = (std::vector<void*>*)list;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (size_t i = 0; i < vec->size(); i++) {
        void* r = fn(cls->env_ptr, (*vec)[i]);
        if (ring_unbox_int(r) != 0) return ring_box_bool(1);
    }
    return ring_box_bool(0);
}

extern "C" void* ring_list_all(void* list, void* closure) {
    auto* vec = (std::vector<void*>*)list;
    RingClosure* cls = (RingClosure*)closure;
    ring_fn_1 fn = (ring_fn_1)(cls->fn_ptr);
    for (size_t i = 0; i < vec->size(); i++) {
        void* r = fn(cls->env_ptr, (*vec)[i]);
        if (ring_unbox_int(r) == 0) return ring_box_bool(0);
    }
    return ring_box_bool(1);
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
        fprintf(stderr, "ring panic: last on empty list\n");
        exit(1);
    }
    return vec->back();
}

extern "C" void* ring_list_first(void* list) {
    auto* vec = (std::vector<void*>*)list;
    if (vec->empty()) {
        fprintf(stderr, "ring panic: first on empty list\n");
        exit(1);
    }
    return vec->front();
}

// ============================================================================
// Map (~10)
// ============================================================================

typedef std::unordered_map<std::string, void*> RingMap;

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
// Set (~8)
// ============================================================================

typedef std::unordered_set<std::string> RingSet;

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
// IO / FS / Process (~8)
// ============================================================================

extern "C" void* ring_print(void* s) {
    printf("%s\n", ((std::string*)s)->c_str());
    fflush(stdout);
    return nullptr;
}

extern "C" void* ring_eprintln(void* s) {
    fprintf(stderr, "%s\n", ((std::string*)s)->c_str());
    fflush(stderr);
    return nullptr;
}

extern "C" void* ring_panic(void* s) {
    fprintf(stderr, "ring panic: %s\n", ((std::string*)s)->c_str());
    fflush(stderr);
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

extern "C" void* ring_exit(int64_t code) {
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

extern "C" void* ring_catch_get_error(void* frame_ptr) {
    return ((RingCatchFrame*)frame_ptr)->error_value;
}

extern "C" void ring_catch_pop() {
    RingCatchFrame* frame = ring_catch_stack;
    ring_catch_stack = frame->prev;
    delete frame;
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

extern "C" int64_t ring_file_exists(void* path) {
    std::string* p = (std::string*)path;
#ifdef _WIN32
    return _access(p->c_str(), 0) == 0 ? 1 : 0;
#else
    return access(p->c_str(), F_OK) == 0 ? 1 : 0;
#endif
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

extern "C" void* ring_json_stringify(void* val) {
    // Stub: for bootstrap, just return a placeholder
    return (void*)new std::string("[json_stringify not implemented]");
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
