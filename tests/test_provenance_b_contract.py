import sys
import unittest
from pathlib import Path


TESTS_DIR = Path(__file__).resolve().parent
if str(TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(TESTS_DIR))

import run_tests as runner


def valid_two_level_c() -> str:
    return r"""
void* seed_fn(void* seed_frame) {
    return RING_UNIT;
}

void* inner_fn(void* inner_scope) {
    /* Decoy: bad = ((void* (*)(void*))(((void**)wrong)[1]))(((void**)wrong)[0]); */
    const char* ignored = "((void**)also_wrong)[0]";
    void* exact_leaf;
    void* evidence_leaf;
    void* method_leaf;
    void* exact_result;
    void* evidence_result;
    exact_leaf = ((void**)inner_scope)[1];
    evidence_leaf = ((void**)inner_scope)[2];
    if (1) { branch_phi = exact_leaf; } else { branch_phi = evidence_leaf; }
    exact_result = ((void* (*)(void*))(((void**)exact_leaf)[0]))(((void**)exact_leaf)[1]);
    method_leaf = ((void**)evidence_leaf)[3];
    evidence_result =
        ((void* (*)(void*))(((void**)method_leaf)[0]))
        (((void**)method_leaf)[1]);
    return evidence_result;
}

void* outer_fn(void* outer_scope) {
    void* exact_forward;
    void* evidence_forward;
    void* inner_env;
    void* inner_pair;
    void* inner_local;
    void* outer_result;
    exact_forward = ((void**)outer_scope)[1];
    evidence_forward = ((void**)outer_scope)[2];
    inner_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);
    *(int64_t*)inner_env = 2;
    ((void**)inner_env)[1] = exact_forward;
    ((void**)inner_env)[2] = evidence_forward;
    inner_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);
    ((void**)inner_pair)[0] = (void*)inner_fn;
    ((void**)inner_pair)[1] = inner_env;
    inner_local = inner_pair;
    outer_result = ((void* (*)(void*))(((void**)inner_local)[0]))(((void**)inner_local)[1]);
    return outer_result;
}

void* parent_root(void* input_capsule) {
    void* seed_env;
    void* seed_pair;
    void* exact_local;
    void* outer_env;
    void* outer_pair;
    void* outer_local;
    void* parent_result;
    seed_env = ring_alloc((int64_t)(sizeof(int64_t) + 0 * sizeof(void*)), 15);
    *(int64_t*)seed_env = 0;
    seed_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);
    ((void**)seed_pair)[0] = (void*)seed_fn;
    ((void**)seed_pair)[1] = seed_env;
    exact_local = seed_pair;
    outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);
    *(int64_t*)outer_env = 2;
    ((void**)outer_env)[1] = exact_local;
    ((void**)outer_env)[2] = input_capsule;
    outer_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);
    ((void**)outer_pair)[0] = (void*)outer_fn;
    ((void**)outer_pair)[1] = outer_env;
    outer_local = outer_pair;
    parent_result = ((void* (*)(void*))(((void**)outer_local)[0]))(((void**)outer_local)[1]);
    return parent_result;
}
"""


class ProvenanceBContractTests(unittest.TestCase):
    def test_registered_source_and_mutation_inventory(self) -> None:
        self.assertEqual(runner.identity_checkpoint_source_errors(), [])

    def test_runtime_fixture_receipt_is_exact(self) -> None:
        expected = (
            runner.REPO
            / "tests"
            / "cases"
            / "provenance_b_capture_identity.expected"
        ).read_text(encoding="utf-8").splitlines()
        self.assertEqual(
            expected, ["15", "15", "true", "7", "12", "true"])

    def test_two_level_fact_analyzer_accepts_direct_and_method_roots(self) -> None:
        self.assertEqual(
            runner.analyze_two_level_provenance_c(
                valid_two_level_c(), "parent_root", "synthetic"),
            [],
        )

    def test_two_level_fact_analyzer_rejects_adversarial_matrix(self) -> None:
        valid = valid_two_level_c()
        mutations = {
            "lambda extra ABI param": valid.replace(
                "void* outer_fn(void* outer_scope)",
                "void* outer_fn(void* outer_scope, void* junk_param)",
            ),
            "lambda wrong ABI param type": valid.replace(
                "void* inner_fn(void* inner_scope)",
                "void* inner_fn(int inner_scope)",
            ),
            "lambda residual ABI junk": valid.replace(
                "void* inner_fn(void* inner_scope)",
                "void* inner_fn(void* inner_scope trailing)",
            ),
            "same inner index": valid.replace(
                "evidence_leaf = ((void**)inner_scope)[2];",
                "evidence_leaf = ((void**)inner_scope)[1];",
            ),
            "exact via evidence container": valid.replace(
                "(((void**)exact_leaf)[0]))(((void**)exact_leaf)[1])",
                "(((void**)evidence_leaf)[0]))(((void**)evidence_leaf)[1])",
                1,
            ),
            "evidence load from exact root": valid.replace(
                "method_leaf = ((void**)evidence_leaf)[3];",
                "method_leaf = ((void**)exact_leaf)[3];",
            ),
            "evidence redefined as exact": valid.replace(
                "evidence_leaf = ((void**)inner_scope)[2];",
                "evidence_leaf = ((void**)inner_scope)[2];\n"
                "    evidence_leaf = exact_leaf;",
            ),
            "method redefined as exact": valid.replace(
                "method_leaf = ((void**)evidence_leaf)[3];",
                "method_leaf = exact_leaf;",
            ),
            "method load then overwrite": valid.replace(
                "method_leaf = ((void**)evidence_leaf)[3];",
                "method_leaf = ((void**)evidence_leaf)[3];\n"
                "    method_leaf = exact_leaf;",
            ),
            "outer forwarding overwrite": valid.replace(
                "evidence_forward = ((void**)outer_scope)[2];",
                "evidence_forward = ((void**)outer_scope)[2];\n"
                "    exact_forward = evidence_forward;",
            ),
            "swapped parent lineage": valid.replace(
                "((void**)outer_env)[1] = exact_local;\n"
                "    ((void**)outer_env)[2] = input_capsule;",
                "((void**)outer_env)[1] = input_capsule;\n"
                "    ((void**)outer_env)[2] = exact_local;",
            ),
            "parent alias cycle": valid.replace(
                "    exact_local = seed_pair;",
                "    exact_local = seed_alias;\n"
                "    seed_alias = exact_local;",
            ),
            "missing exact root": valid.replace(
                "    exact_result = ((void* (*)(void*))(((void**)exact_leaf)[0]))(((void**)exact_leaf)[1]);\n",
                "",
            ),
            "ambiguous direct roots": valid.replace(
                "    method_leaf = ((void**)evidence_leaf)[3];",
                "    exact_result = ((void* (*)(void*))(((void**)evidence_leaf)[0]))(((void**)evidence_leaf)[1]);\n"
                "    method_leaf = ((void**)evidence_leaf)[3];",
            ),
            "method duplicate target indices": valid.replace(
                "    method_leaf = ((void**)evidence_leaf)[3];",
                "    method_leaf = ((void**)evidence_leaf)[3];\n"
                "    method_leaf = ((void**)evidence_leaf)[4];",
            ),
            "method duplicate containers": valid.replace(
                "    method_leaf = ((void**)evidence_leaf)[3];",
                "    method_leaf = ((void**)evidence_leaf)[3];\n"
                "    method_leaf = ((void**)exact_leaf)[4];",
            ),
            "duplicate store index": valid.replace(
                "    ((void**)outer_env)[1] = exact_local;",
                "    ((void**)outer_env)[1] = exact_local;\n"
                "    ((void**)outer_env)[1] = input_capsule;",
            ),
            "zero capture slot": valid.replace(
                "exact_leaf = ((void**)inner_scope)[1];",
                "exact_leaf = ((void**)inner_scope)[0];",
            ),
            "zero method slot": valid.replace(
                "method_leaf = ((void**)evidence_leaf)[3];",
                "method_leaf = ((void**)evidence_leaf)[0];",
            ),
            "header count mismatch": valid.replace(
                "*(int64_t*)outer_env = 2;",
                "*(int64_t*)outer_env = 3;",
            ),
            "type15 allocation capacity mismatch": valid.replace(
                "outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);",
                "outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 3 * sizeof(void*)), 15);",
            ),
            "capture store gap": valid.replace(
                "((void**)outer_env)[2] = input_capsule;",
                "((void**)outer_env)[3] = input_capsule;",
            ),
            "capture store before header": valid.replace(
                "    *(int64_t*)outer_env = 2;\n"
                "    ((void**)outer_env)[1] = exact_local;",
                "    ((void**)outer_env)[1] = exact_local;\n"
                "    *(int64_t*)outer_env = 2;",
            ),
            "header before allocation": valid.replace(
                "    outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);\n"
                "    *(int64_t*)outer_env = 2;",
                "    *(int64_t*)outer_env = 2;\n"
                "    outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);",
            ),
            "capture source undefined": valid.replace(
                "((void**)outer_env)[1] = exact_local;",
                "((void**)outer_env)[1] = ghost_capture;",
            ),
            "type7 slot order reversed": valid.replace(
                "    ((void**)outer_pair)[0] = (void*)outer_fn;\n"
                "    ((void**)outer_pair)[1] = outer_env;",
                "    ((void**)outer_pair)[1] = outer_env;\n"
                "    ((void**)outer_pair)[0] = (void*)outer_fn;",
            ),
            "type7 allocation size mismatch": valid.replace(
                "outer_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);",
                "outer_pair = ring_alloc((int64_t)(3 * sizeof(void*)), 7);",
            ),
            "type7 pre-allocation lambda slot": valid.replace(
                "    outer_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);\n"
                "    ((void**)outer_pair)[0] = (void*)outer_fn;",
                "    ((void**)outer_pair)[0] = (void*)outer_fn;\n"
                "    outer_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);",
            ),
            "type7 allocated before env ready": valid.replace(
                "    outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);",
                "    outer_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);\n"
                "    outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);",
            ).replace(
                "    outer_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);\n"
                "    ((void**)outer_pair)[0] = (void*)outer_fn;",
                "    ((void**)outer_pair)[0] = (void*)outer_fn;",
                1,
            ),
            "type7 extra slot": valid.replace(
                "    ((void**)outer_pair)[1] = outer_env;",
                "    ((void**)outer_pair)[1] = outer_env;\n"
                "    ((void**)outer_pair)[2] = outer_env;",
            ),
            "type7 slot0 overwrite": valid.replace(
                "    ((void**)outer_pair)[0] = (void*)outer_fn;",
                "    ((void**)outer_pair)[0] = (void*)outer_fn;\n"
                "    ((void**)outer_pair)[0] = outer_env;",
            ),
            "type7 wrong environment": valid.replace(
                "    ((void**)outer_pair)[1] = outer_env;",
                "    ((void**)outer_pair)[1] = seed_env;",
            ),
            "orphan type15": valid.replace(
                "    outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);",
                "    orphan_env = ring_alloc((int64_t)sizeof(int64_t), 15);\n"
                "    *(int64_t*)orphan_env = 0;\n"
                "    outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);",
            ),
            "orphan type7": valid.replace(
                "    outer_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);",
                "    orphan_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);\n"
                "    outer_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);",
            ),
            "orphan lambda slot": valid.replace(
                "    ((void**)outer_pair)[0] = (void*)outer_fn;",
                "    ((void**)not_a_pair)[0] = (void*)outer_fn;\n"
                "    ((void**)outer_pair)[0] = (void*)outer_fn;",
            ),
            "old temp-copy assumption": valid.replace(
                "    exact_result = ((void* (*)(void*))(((void**)exact_leaf)[0]))(((void**)exact_leaf)[1]);",
                "    copied_leaf = exact_leaf;\n"
                "    exact_result = ((void* (*)(void*))(((void**)copied_leaf)[0]))(((void**)copied_leaf)[1]);",
            ),
            "extra inner closure": valid.replace(
                "    return evidence_result;",
                "    extra_env = ring_alloc((int64_t)sizeof(int64_t), 15);\n"
                "    extra_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);\n"
                "    ((void**)extra_pair)[0] = (void*)seed_fn;\n"
                "    ((void**)extra_pair)[1] = extra_env;\n"
                "    return evidence_result;",
            ),
            "extra parent closure": valid.replace(
                "    outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);",
                "    surplus_env = ring_alloc((int64_t)sizeof(int64_t), 15);\n"
                "    surplus_pair = ring_alloc((int64_t)(2 * sizeof(void*)), 7);\n"
                "    ((void**)surplus_pair)[0] = (void*)seed_fn;\n"
                "    ((void**)surplus_pair)[1] = surplus_env;\n"
                "    outer_env = ring_alloc((int64_t)(sizeof(int64_t) + 2 * sizeof(void*)), 15);",
            ),
            "extra parent uniform call": valid.replace(
                "    return parent_result;",
                "    parent_extra = ((void* (*)(void*))(((void**)outer_local)[0]))(((void**)outer_local)[1]);\n"
                "    return parent_result;",
            ),
            "extra outer uniform call": valid.replace(
                "    return outer_result;",
                "    outer_extra = ((void* (*)(void*))(((void**)inner_local)[0]))(((void**)inner_local)[1]);\n"
                "    return outer_result;",
            ),
            "unrecognized closure call": valid.replace(
                "(((void**)exact_leaf)[0]))(((void**)exact_leaf)[1])",
                "(((void**)exact_leaf)[1]))(((void**)exact_leaf)[0])",
                1,
            ),
            "cast argument arity mismatch": valid.replace(
                "((void* (*)(void*))(((void**)exact_leaf)[0]))",
                "((void* (*)(void*, void*))(((void**)exact_leaf)[0]))",
                1,
            ),
            "cast non-void type": valid.replace(
                "((void* (*)(void*))(((void**)exact_leaf)[0]))",
                "((void* (*)(int*))(((void**)exact_leaf)[0]))",
                1,
            ),
            "nonidentifier call argument": valid.replace(
                "(((void**)exact_leaf)[1]);",
                "(((void**)exact_leaf)[1], RING_INT(1));",
                1,
            ),
            "undefined identifier call argument": valid.replace(
                "((void* (*)(void*))(((void**)exact_leaf)[0]))(((void**)exact_leaf)[1]);",
                "((void* (*)(void*, void*))(((void**)exact_leaf)[0]))(((void**)exact_leaf)[1], ghost_arg);",
                1,
            ),
            "extra pointer receiver": valid.replace(
                "(((void**)exact_leaf)[1]);",
                "(((void**)exact_leaf)[1], ((void**)evidence_leaf)[8]);",
                1,
            ),
            "extra closure cast": valid.replace(
                "((void* (*)(void*))(((void**)exact_leaf)[0]))",
                "((void* (*)(void*))((void* (*)(void*))(((void**)exact_leaf)[0])))",
                1,
            ),
        }
        for name, mutated in mutations.items():
            with self.subTest(name=name):
                self.assertTrue(
                    runner.analyze_two_level_provenance_c(
                        mutated, "parent_root", name),
                    name,
                )


if __name__ == "__main__":
    unittest.main()
