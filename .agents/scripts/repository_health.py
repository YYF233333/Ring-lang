#!/usr/bin/env python3
"""Validate bounded Repository Steward worktree/ref/authority health."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


SCHEMA = "ring.repository-health.v1"
ACTIVE = {"planning", "doing", "waiting-feedback"}
BACKLOG = re.compile(r"^### (?P<item>B-\d{3}) .* \[(?P<state>queued|planning|waiting-feedback|doing(?::[^\]]+)?)\](?: \[[^\]]+\])*$")
AUDIT = re.compile(r"^### (?P<item>#\d+) .* \[(?P<state>open|doing)\](?: \[[^\]]+\])*$")


class HealthError(RuntimeError):
    pass


def git(repo: Path, *args: str, check: bool = True) -> str:
    result = subprocess.run(
        ["git", "-C", str(repo), *args], check=False,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        encoding="utf-8", errors="replace", text=True,
    )
    if check and result.returncode != 0:
        raise HealthError(f"git {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def worktrees(repo: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    for line in git(repo, "worktree", "list", "--porcelain").splitlines():
        if line.startswith("worktree "):
            if current is not None:
                rows.append(current)
            current = {"path": str(Path(line[9:]).resolve()), "branch": "", "head": ""}
        elif current is not None and line.startswith("branch "):
            current["branch"] = line[7:].removeprefix("refs/heads/")
        elif current is not None and line.startswith("HEAD "):
            current["head"] = line[5:]
    if current is not None:
        rows.append(current)
    return rows


def headings(text: str) -> tuple[dict[str, str], dict[str, str]]:
    all_items: dict[str, str] = {}
    active: dict[str, str] = {}
    for line in text.splitlines():
        match = BACKLOG.fullmatch(line) or AUDIT.fullmatch(line)
        if match is None:
            continue
        item = match.group("item")
        state = match.group("state").split(":", 1)[0]
        if item in all_items:
            raise HealthError(f"duplicate board item: {item}")
        all_items[item] = line
        if state in ACTIVE or (item.startswith("#") and state == "doing"):
            active[item] = state
    return all_items, active


def branch_text(repo: Path, branch: str, path: str) -> str:
    return git(repo, "show", f"{branch}:{path}")


def board_authority_errors(
    configured_names: set[str],
    board_items: list[str],
    item_authorities: Any,
    active_authorities: dict[str, str],
) -> list[str]:
    errors: list[str] = []
    if not isinstance(item_authorities, dict):
        return ["board_item_authorities must be an object"]
    expected = set(board_items)
    actual = set(item_authorities)
    if actual != expected:
        errors.append(
            "board item authority drift: "
            f"extra={sorted(actual - expected)}, missing={sorted(expected - actual)}"
        )
    for item, branch in item_authorities.items():
        if not isinstance(branch, str) or branch not in configured_names:
            errors.append(f"board item {item} has unknown authority branch {branch!r}")
        active_branch = active_authorities.get(item)
        if active_branch is not None and active_branch != branch:
            errors.append(
                f"board item {item} authority {branch} conflicts with active "
                f"authority {active_branch}"
            )
    return errors


def board_heading_errors(
    main_items: dict[str, str],
    item_authorities: dict[str, str],
    authority_items: dict[str, dict[str, str]],
) -> list[str]:
    errors: list[str] = []
    for item, branch in item_authorities.items():
        if main_items.get(item) != authority_items.get(branch, {}).get(item):
            errors.append(f"main/authority board drift: {item} ({branch})")
    return errors


def validate(repo: Path, config: dict[str, Any], *, local: bool,
             allow_origin_lag: bool) -> dict[str, Any]:
    errors: list[str] = []
    if config.get("schema") != SCHEMA:
        errors.append("config schema mismatch")
    branches_cfg = config.get("branches")
    if not isinstance(branches_cfg, list):
        raise HealthError("config branches must be a list")
    configured = {row["name"]: row for row in branches_cfg}
    if len(configured) != len(branches_cfg):
        errors.append("duplicate configured branch")
    experiments = [row for row in branches_cfg if row.get("role") == "experiment"]
    if len(experiments) > 1:
        errors.append("more than one experiment branch")

    actual_branches = set(git(
        repo, "for-each-ref", "--format=%(refname:short)", "refs/heads"
    ).splitlines())
    expected_branches = set(configured)
    if actual_branches != expected_branches:
        errors.append(
            f"local branch drift: extra={sorted(actual_branches - expected_branches)}, "
            f"missing={sorted(expected_branches - actual_branches)}"
        )

    rows = worktrees(repo)
    if len(rows) > int(config.get("max_worktrees", 5)):
        errors.append(f"worktree limit exceeded: {len(rows)}")
    dirty: list[str] = []
    for row in rows:
        if git(repo, "-C", row["path"], "status", "--porcelain"):
            dirty.append(row["path"])
    if len(dirty) > int(config.get("max_dirty_worktrees", 0)):
        errors.append(f"dirty worktree limit exceeded: {dirty}")

    for name, row in configured.items():
        checkpoint = row.get("checkpoint")
        if checkpoint:
            result = subprocess.run(
                ["git", "-C", str(repo), "merge-base", "--is-ancestor",
                 str(checkpoint), name], check=False,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            if result.returncode != 0:
                errors.append(f"branch {name} does not contain checkpoint {checkpoint}")

    main_board = "\n".join((
        branch_text(repo, "main", "docs/backlog.md"),
        branch_text(repo, "main", "docs/audit-report.md"),
    ))
    main_items, main_active = headings(main_board)
    authority_for: dict[str, str] = {}
    for name, row in configured.items():
        for item in row.get("active_items", []):
            if item in authority_for:
                errors.append(f"active item has multiple authorities: {item}")
            authority_for[item] = name
    if set(main_active) != set(authority_for):
        errors.append(
            f"active item/authority drift: board={sorted(main_active)}, "
            f"map={sorted(authority_for)}"
        )

    board_items = config.get("board_items", [])
    item_authorities = config.get("board_item_authorities")
    errors.extend(board_authority_errors(
        set(configured), board_items, item_authorities, authority_for))
    if isinstance(item_authorities, dict):
        authority_items_by_branch: dict[str, dict[str, str]] = {}
        for branch in set(item_authorities.values()):
            if not isinstance(branch, str) or branch not in configured:
                continue
            authority_board = "\n".join((
                branch_text(repo, branch, "docs/backlog.md"),
                branch_text(repo, branch, "docs/audit-report.md"),
            ))
            authority_items_by_branch[branch], _ = headings(authority_board)
        errors.extend(board_heading_errors(
            main_items, item_authorities, authority_items_by_branch))

    for name, row in configured.items():
        base = row.get("pollution_base")
        allowed = tuple(row.get("allowed_paths_after_base", []))
        if not base or name == "main":
            continue
        changed = git(repo, "diff", "--name-only", f"{base}..{name}").splitlines()
        polluted = [path for path in changed if not path.startswith(allowed)]
        if polluted:
            errors.append(f"cross-item branch pollution on {name}: {polluted[:10]}")

    behind, ahead = (int(value) for value in git(
        repo, "rev-list", "--left-right", "--count", "origin/main...main"
    ).split())
    oldest_hours = 0.0
    if ahead:
        timestamps = [int(value) for value in git(
            repo, "log", "--format=%ct", "origin/main..main"
        ).splitlines()]
        oldest_hours = (time.time() - min(timestamps)) / 3600.0
    if behind:
        errors.append(f"main is behind origin/main by {behind}")
    if not allow_origin_lag:
        if ahead > int(config.get("max_main_ahead", 10)):
            errors.append(f"main ahead push threshold exceeded: {ahead}")
        if oldest_hours > float(config.get("max_unpushed_age_hours", 24)):
            errors.append(f"oldest unpushed commit threshold exceeded: {oldest_hours:.2f}h")

    if local:
        for record in config.get("local_backup_artifacts", []):
            path = Path(record["path"])
            if not path.is_file():
                errors.append(f"local backup artifact missing: {path}")
            elif sha256(path) != record["sha256"]:
                errors.append(f"local backup artifact hash drift: {path}")

    result = {
        "worktrees": len(rows),
        "dirty_worktrees": len(dirty),
        "local_branches": len(actual_branches),
        "active_items": sorted(main_active),
        "main_ahead": ahead,
        "main_behind": behind,
        "oldest_unpushed_hours": oldest_hours,
        "errors": errors,
    }
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--config", type=Path,
                        default=Path("docs/repository-health.json"))
    parser.add_argument("--local", action="store_true")
    parser.add_argument("--allow-origin-lag", action="store_true")
    args = parser.parse_args()
    repo = args.repo.resolve()
    config_path = args.config if args.config.is_absolute() else repo / args.config
    config = json.loads(config_path.read_text(encoding="utf-8"))
    try:
        result = validate(repo, config, local=args.local,
                          allow_origin_lag=args.allow_origin_lag)
    except (HealthError, OSError, ValueError) as error:
        print(f"repository health failed: {error}")
        return 1
    print(json.dumps(result, indent=2, sort_keys=True))
    return 1 if result["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
