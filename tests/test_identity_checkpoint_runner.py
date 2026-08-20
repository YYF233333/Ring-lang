import hashlib
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


TESTS_DIR = Path(__file__).resolve().parent
if str(TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(TESTS_DIR))

import run_tests as runner


class IdentityCheckpointRunnerTests(unittest.TestCase):
    def test_unset_candidate_runs_source_oracle_only(self) -> None:
        with (
            patch.dict(os.environ, {}, clear=True),
            patch.object(
                runner, "identity_checkpoint_source_errors", return_value=[]
            ) as source_oracle,
            patch.object(
                runner, "default_body_identity_generated_c_errors"
            ) as generated_oracle,
        ):
            errors, detail = runner.identity_checkpoint_errors()

        self.assertEqual(errors, [])
        self.assertIn("source/mutation only", detail)
        source_oracle.assert_called_once_with()
        generated_oracle.assert_not_called()

    def test_set_candidate_invokes_exact_hashed_executable(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            candidate = Path(tmpdir) / "candidate ring.exe"
            candidate_bytes = b"exact I-prime candidate"
            candidate.write_bytes(candidate_bytes)
            resolved = str(candidate.resolve(strict=True))
            expected_hash = hashlib.sha256(candidate_bytes).hexdigest()

            with (
                patch.dict(
                    os.environ,
                    {runner.IDENTITY_CANDIDATE_ENV: resolved},
                    clear=True,
                ),
                patch.object(
                    runner, "identity_checkpoint_source_errors", return_value=[]
                ) as source_oracle,
                patch.object(
                    runner, "default_body_identity_generated_c_errors",
                    return_value=[],
                ) as generated_oracle,
            ):
                errors, detail = runner.identity_checkpoint_errors()

        self.assertEqual(errors, [])
        self.assertIn(f"candidate={resolved}", detail)
        self.assertIn(f"sha256={expected_hash}", detail)
        source_oracle.assert_called_once_with()
        generated_oracle.assert_called_once_with(resolved)

    def test_candidate_mutation_during_generated_gate_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            candidate = Path(tmpdir) / "candidate.exe"
            candidate.write_bytes(b"candidate before gate")
            resolved = str(candidate.resolve(strict=True))

            def mutate_candidate(path: str) -> list[str]:
                self.assertEqual(path, resolved)
                candidate.write_bytes(b"candidate changed during gate")
                return []

            with (
                patch.dict(
                    os.environ,
                    {runner.IDENTITY_CANDIDATE_ENV: resolved},
                    clear=True,
                ),
                patch.object(
                    runner, "identity_checkpoint_source_errors", return_value=[]
                ),
                patch.object(
                    runner, "default_body_identity_generated_c_errors",
                    side_effect=mutate_candidate,
                ) as generated_oracle,
            ):
                errors, _ = runner.identity_checkpoint_errors()

        self.assertIn(
            "candidate executable identity changed during generated-C gate",
            errors,
        )
        generated_oracle.assert_called_once_with(resolved)

    def test_invalid_candidate_identity_never_runs_generated_gate(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            cases = (
                ("", "is empty"),
                ("relative-candidate.exe", "must be an absolute path"),
                (str(root / "missing.exe"), "cannot resolve/hash"),
                (str(root), "is not a regular file"),
            )
            for raw, expected in cases:
                with self.subTest(candidate=raw):
                    with (
                        patch.dict(
                            os.environ,
                            {runner.IDENTITY_CANDIDATE_ENV: raw},
                            clear=True,
                        ),
                        patch.object(
                            runner, "identity_checkpoint_source_errors",
                            return_value=[],
                        ),
                        patch.object(
                            runner,
                            "default_body_identity_generated_c_errors",
                        ) as generated_oracle,
                    ):
                        errors, _ = runner.identity_checkpoint_errors()

                    self.assertTrue(
                        any(expected in error for error in errors), errors)
                    generated_oracle.assert_not_called()


if __name__ == "__main__":
    unittest.main()
