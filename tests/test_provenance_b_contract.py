import sys
import unittest
from pathlib import Path


TESTS_DIR = Path(__file__).resolve().parent
if str(TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(TESTS_DIR))

import run_tests as runner


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


if __name__ == "__main__":
    unittest.main()
