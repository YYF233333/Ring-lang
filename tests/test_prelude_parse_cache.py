from pathlib import Path
import re
import unittest


REPO = Path(__file__).resolve().parents[1]
CHECKER = (REPO / "compiler" / "checker.ring").read_text(encoding="utf-8")
COMPILER_MOD = (REPO / "compiler" / "compiler_mod.ring").read_text(
    encoding="utf-8"
)


def function_body(source: str, name: str) -> str:
    header = re.search(rf"\b(?:pub\s+)?fn\s+{re.escape(name)}\s*\(", source)
    if header is None:
        raise AssertionError(f"missing Ring function {name}")
    opening = source.find("{", header.end())
    if opening < 0:
        raise AssertionError(f"missing body for Ring function {name}")

    depth = 1
    index = opening + 1
    in_string = False
    while index < len(source):
        char = source[index]
        if in_string:
            if char == "\\":
                index += 2
                continue
            if char == '"':
                in_string = False
            index += 1
            continue
        if source.startswith("//", index):
            newline = source.find("\n", index + 2)
            index = len(source) if newline < 0 else newline + 1
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return source[opening + 1:index]
        index += 1
    raise AssertionError(f"unterminated body for Ring function {name}")


class PreludeParseCacheTests(unittest.TestCase):
    def test_snapshot_contains_only_canonical_syntax(self) -> None:
        snapshot = re.search(
            r"\bpub\s+struct\s+PreludeSyntax\s*\{(?P<body>[^}]*)\}",
            CHECKER,
            re.DOTALL,
        )
        self.assertIsNotNone(snapshot)
        compact = re.sub(r"\s+", "", snapshot.group("body"))
        self.assertEqual(compact, "decls:List<Decl>")

        body = function_body(CHECKER, "parse_prelude_syntax")
        for operation in (
            "for file in (STD_FILES)",
            "read_file(file_path)",
            "parse(source, file_path, prelude_sink)",
            "canonicalize_loaded_prelude_decl_firebreak(decl)",
            "none => none",
        ):
            self.assertEqual(body.count(operation), 1, operation)
        for semantic_state in (
            "InferCtx",
            "TypeEnv",
            "HDecl",
            "DefId",
            "OwnershipMetadata",
            "register_prelude_decl_public",
            "check_prelude_decl",
        ):
            self.assertNotIn(semantic_state, body)

    def test_load_replays_the_single_semantic_pipeline(self) -> None:
        body = function_body(CHECKER, "load_prelude")
        for forbidden in (
            "find_std_dir",
            "read_file",
            "parse(",
            "canonicalize_loaded_prelude_decl_firebreak",
        ):
            self.assertNotIn(forbidden, body)

        registration = body.index(
            "register_prelude_decl_public(ctx, registration_decl)"
        )
        alias = body.index("let map_get_name = map_index_helper_source_name()")
        exact_rebind = body.index("exact_prelude_extern_ownership(")
        emitted = body.index("let mut emitted_prelude_externs: Set<Int>")
        checking = body.index("check_prelude_decl(ctx, decl)")
        self.assertLess(registration, alias)
        self.assertLess(alias, exact_rebind)
        self.assertLess(exact_rebind, emitted)
        self.assertLess(emitted, checking)
        self.assertEqual(body.count("for decl in all_prelude_decls"), 3)
        for authority in (
            "set_callable_result_role(",
            "record_value_origin(ctx, name, exact_origin)",
            "HDecl::ExternFn",
            "ctx.env.types.ownership_metadata",
            "none => {}",
        ):
            self.assertIn(authority, body)

    def test_project_parses_once_before_fresh_module_replay(self) -> None:
        phases = function_body(COMPILER_MOD, "compile_phases")
        parse_once = phases.index("let prelude_syntax = parse_prelude_syntax()")
        check_loop_comment = phases.index("// Check all modules in topological order")
        check_loop = phases.index("for key in graph.topo_order", check_loop_comment)
        check_call = phases.index("let result = check_module(", check_loop)
        self.assertLess(parse_once, check_loop)
        self.assertLess(check_loop, check_call)
        self.assertEqual(phases.count("parse_prelude_syntax()"), 1)
        self.assertIn("prelude_syntax, sink)", phases[check_call:])

        module_check = function_body(CHECKER, "check_module")
        fresh_ctx = module_check.index("new_infer_ctx(")
        replay = module_check.index("load_prelude(ctx, prelude_syntax)")
        dependency_exports = module_check.index("inject_module_exports(")
        self.assertLess(fresh_ctx, replay)
        self.assertLess(replay, dependency_exports)
        self.assertNotIn("parse_prelude_syntax", module_check)


if __name__ == "__main__":
    unittest.main()
