#!/usr/bin/env python3
"""Reject out-of-scope, secret-looking, archived, or oversized changes."""

from __future__ import annotations

import argparse
import hashlib
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parents[1]
ALLOWED_EXACT = {
    ".gitattributes",
    ".gitignore",
    "AGENTS.md",
    "CLAUDE.md",
    "battle.html",
}
ALLOWED_PREFIXES = (".github/", "battle-dev/", "docs/", "scripts/")
FORBIDDEN_SUFFIXES = {".7z", ".dll", ".exe", ".key", ".pem", ".pfx", ".rar", ".zip"}
MAX_FILE_BYTES = 20 * 1024 * 1024
SECRET_PATTERNS = {
    "AWS access key": re.compile(rb"(?:AKIA|ASIA)[0-9A-Z]{16}"),
    "GitHub token": re.compile(rb"(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,})"),
    "OpenAI-style key": re.compile(rb"sk-[A-Za-z0-9_-]{20,}"),
    "Google API key": re.compile(rb"AIza[0-9A-Za-z_-]{30,}"),
    "private key": re.compile(rb"-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----"),
}


def git(*args: str) -> list[str]:
    result = subprocess.run(
        ["git", "-c", f"safe.directory={ROOT.as_posix()}", *args],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return [line for line in result.stdout.splitlines() if line]


def candidate_paths(mode: str) -> list[str]:
    if mode == "staged":
        return git("diff", "--cached", "--name-only", "--diff-filter=ACMRD")
    if mode == "tracked":
        return git("ls-files")
    changed = git("diff", "--name-only", "--diff-filter=ACMRD")
    untracked = git("ls-files", "--others", "--exclude-standard")
    return sorted(set(changed + untracked))


def is_allowed(path: str) -> bool:
    return path in ALLOWED_EXACT or path.startswith(ALLOWED_PREFIXES)


def scan_file(path: str, problems: list[str]) -> None:
    normalized = PurePosixPath(path)
    disk_path = ROOT.joinpath(*normalized.parts)
    if not disk_path.exists():
        problems.append(f"deletion is not automated: {path}")
        return
    if disk_path.is_symlink():
        problems.append(f"symbolic link is not allowed: {path}")
        return
    if not disk_path.is_file():
        return
    if disk_path.name == ".env" or disk_path.name.startswith(".env."):
        problems.append(f"environment file is not allowed: {path}")
    if disk_path.suffix.lower() in FORBIDDEN_SUFFIXES:
        problems.append(f"archive/binary credential type is not allowed: {path}")
    size = disk_path.stat().st_size
    if size > MAX_FILE_BYTES:
        problems.append(f"file exceeds {MAX_FILE_BYTES // (1024 * 1024)} MiB: {path} ({size} bytes)")
        return
    data = disk_path.read_bytes()
    for label, pattern in SECRET_PATTERNS.items():
        if pattern.search(data):
            problems.append(f"{label} pattern detected: {path}")


def verify_battle_sync(problems: list[str]) -> None:
    public = ROOT / "battle.html"
    generated = ROOT / "battle-dev" / "dist" / "battle.html"
    if not public.exists() or not generated.exists():
        return
    public_hash = hashlib.sha256(public.read_bytes()).digest()
    generated_hash = hashlib.sha256(generated.read_bytes()).digest()
    if public_hash != generated_hash:
        problems.append("battle.html is not synchronized with battle-dev/dist/battle.html")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("working-tree", "staged", "tracked"), default="working-tree")
    args = parser.parse_args()

    problems: list[str] = []
    paths = candidate_paths(args.mode)
    for path in paths:
        path = path.replace("\\", "/")
        if not is_allowed(path):
            if args.mode != "tracked":
                problems.append(f"out-of-scope path: {path}")
            continue
        scan_file(path, problems)
    verify_battle_sync(problems)

    if problems:
        print("Repository safety check failed:", file=sys.stderr)
        for problem in problems:
            print(f"- {problem}", file=sys.stderr)
        return 1
    print(f"Repository safety check passed ({args.mode}, {len(paths)} paths).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
