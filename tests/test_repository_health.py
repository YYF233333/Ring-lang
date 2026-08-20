from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / ".agents" / "scripts" / "repository_health.py"
SPEC = importlib.util.spec_from_file_location("repository_health", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
health = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(health)


class RepositoryHealthBoardAuthorityTests(unittest.TestCase):
    def test_each_active_item_must_use_its_real_authority(self) -> None:
        errors = health.board_authority_errors(
            {"main", "codex/ownership", "codex/evidence"},
            ["#268", "B-188"],
            {"#268": "codex/ownership", "B-188": "codex/ownership"},
            {"#268": "codex/ownership", "B-188": "codex/evidence"},
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("B-188", errors[0])
        self.assertIn("conflicts", errors[0])

    def test_board_item_mapping_is_total_and_uses_configured_branches(self) -> None:
        errors = health.board_authority_errors(
            {"main", "codex/ownership"},
            ["#268", "B-188"],
            {"#268": "codex/missing", "B-extra": "main"},
            {"#268": "codex/ownership"},
        )
        self.assertTrue(any("extra" in error and "missing" in error
                            for error in errors), errors)
        self.assertTrue(any("unknown authority" in error for error in errors), errors)

    def test_heading_drift_is_checked_against_per_item_branch(self) -> None:
        heading_268 = "### #268 ownership [critical] [judgment] [doing]"
        heading_188 = (
            "### B-188 evidence [infra] [P1] [M] [judgment] [planning]"
        )
        errors = health.board_heading_errors(
            {"#268": heading_268, "B-188": heading_188},
            {"#268": "codex/ownership", "B-188": "codex/evidence"},
            {
                "codex/ownership": {"#268": heading_268, "B-188": heading_188},
                "codex/evidence": {"B-188": heading_188 + " drift"},
            },
        )
        self.assertEqual(
            errors,
            ["main/authority board drift: B-188 (codex/evidence)"],
        )


if __name__ == "__main__":
    unittest.main()
