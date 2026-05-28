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

#ifdef _WIN32
#include <direct.h>  // _getcwd
#else
#include <unistd.h>  // getcwd
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
    for (int i = 0; i < g_argc; i++) {
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
