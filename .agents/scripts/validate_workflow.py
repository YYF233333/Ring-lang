#!/usr/bin/env python3
"""Validate Ring-lang's durable agent-workflow contracts."""

from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ERRORS: list[str] = []

BACKLOG_ACTIVE = re.compile(
    r"\[(?:queued|planning|waiting-feedback|doing(?::[^\]]+)?)\]"
)
BACKLOG_HEADING = re.compile(
    r"^### B-\d{3} .+?\[(?:feature|design-align|refactor|bugfix|infra)\] "
    r"\[P[0-3]\] \[(?:S|M|L|XL)\] \[(?:mechanical|judgment)\] "
    r"\[(?:queued|planning|waiting-feedback|doing(?::[^\]]+)?)\]"
    r"(?: \[[^\]]+\])*$"
)
AUDIT_ACTIVE = re.compile(r"\[(?:open|doing)\]")
AUDIT_HEADING = re.compile(
    r"^### #\d+ .+?\[(?:critical|medium|low)\] "
    r"\[(?:mechanical|judgment)\] \[(?:open|doing)\]"
    r"(?: \[[^\]]+\])*$"
)


def read_lines(relative: str) -> list[str]:
    path = ROOT / relative
    if not path.is_file():
        ERRORS.append(f"missing file: {relative}")
        return []
    return path.read_text(encoding="utf-8").splitlines()


def validate_headings() -> tuple[int, int]:
    backlog_count = 0
    for number, line in enumerate(read_lines("docs/backlog.md"), start=1):
        if line.startswith("### B-") and BACKLOG_ACTIVE.search(line):
            backlog_count += 1
            if not BACKLOG_HEADING.fullmatch(line):
                ERRORS.append(
                    f"docs/backlog.md:{number}: invalid active heading: {line}"
                )

    audit_count = 0
    for number, line in enumerate(read_lines("docs/audit-report.md"), start=1):
        if line.startswith("### #") and AUDIT_ACTIVE.search(line):
            audit_count += 1
            if not AUDIT_HEADING.fullmatch(line):
                ERRORS.append(
                    f"docs/audit-report.md:{number}: invalid active heading: {line}"
                )
    return backlog_count, audit_count


def validate_codex_skills() -> None:
    stale_patterns = {
        "Agent({": "Claude Code pseudo Agent API",
        "model: opus": "Claude model name",
        "node compiler/dist/main.js": "retired JS bootstrap command",
        "feedback 是唯一的信息通道": "one-shot-only feedback assumption",
    }
    skill_paths = [
        ".agents/skills/discussion/SKILL.md",
        ".agents/skills/worker/SKILL.md",
        ".agents/skills/full-audit/SKILL.md",
    ]
    for relative in skill_paths:
        text = "\n".join(read_lines(relative))
        for pattern, label in stale_patterns.items():
            if pattern in text:
                ERRORS.append(f"{relative}: contains stale {label}: {pattern!r}")

    audit_skill = "\n".join(read_lines(".agents/skills/full-audit/SKILL.md"))
    for required in (
        "每次触发只执行一轮",
        "不得自动开始下一轮",
        "下一轮需用户手动触发",
    ):
        if required not in audit_skill:
            ERRORS.append(
                f".agents/skills/full-audit/SKILL.md: missing policy: {required}"
            )


def validate_codex_config() -> None:
    config_path = ROOT / ".codex" / "config.toml"
    if not config_path.is_file():
        ERRORS.append("missing file: .codex/config.toml")
        return
    try:
        with config_path.open("rb") as handle:
            config = tomllib.load(handle)
    except (OSError, tomllib.TOMLDecodeError) as error:
        ERRORS.append(f".codex/config.toml: {error}")
        return

    agents = config.get("agents")
    if not isinstance(agents, dict):
        ERRORS.append(".codex/config.toml: missing [agents] table")
        return

    for role in ("implementer", "reviewer", "finder", "skeptic"):
        entry = agents.get(role)
        if not isinstance(entry, dict):
            ERRORS.append(f".codex/config.toml: missing [agents.{role}]")
            continue
        relative = entry.get("config_file")
        if not isinstance(relative, str):
            ERRORS.append(f".codex/config.toml: agents.{role}.config_file missing")
            continue
        role_path = config_path.parent / relative
        if not role_path.is_file():
            ERRORS.append(
                f".codex/config.toml: agents.{role}.config_file not found: {relative}"
            )
            continue
        try:
            with role_path.open("rb") as handle:
                tomllib.load(handle)
        except (OSError, tomllib.TOMLDecodeError) as error:
            ERRORS.append(f"{role_path.relative_to(ROOT)}: {error}")


def main() -> int:
    backlog_count, audit_count = validate_headings()
    validate_codex_skills()
    validate_codex_config()

    if ERRORS:
        print("workflow validation failed:")
        for error in ERRORS:
            print(f"- {error}")
        return 1

    print(
        "workflow validation passed: "
        f"{backlog_count} active backlog items, "
        f"{audit_count} active audit items, "
        "4 Codex roles"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
