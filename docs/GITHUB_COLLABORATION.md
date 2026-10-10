# GitHub-centered collaboration

## Migration baseline

- GitHub `main` before migration: `cf2c5386764146e72a2f277010ec5b3ad6eef5ef`.
- GitHub `battle.html`: SHA256 `907c6f8f193c1c70e74520f41a39a17575eb5cd766c9278b9d6f9b56cd8700b2` (the former S03-U287 build).
- Imported clean checkpoint: `checkpoint_claude_s03_u302_u302_batch10_20261010.zip`.
- Checkpoint SHA256: `a155a07610dc86b0f7a34a5bfe9b9f910565a2f2035b9396a393e96bc4d2d040`.
- Imported `battle-dev/dist/battle.html`: SHA256 `b2f2a21b1080ee682c12656fdad4bc311d6299b600b134b888e1ffdc351ed6e7`.
- The imported ZIP contained 1,526 files and was rechecked after extraction with zero missing or mismatched files.
- The validated U302 tree and generated HTML are marked `-text` in `.gitattributes` so Git does not rewrite their historical mixed line endings during the initial import.
- The previous GitHub artifact differs from U302 by 1,274 added and 83 removed lines. U302 is therefore the migration source; the old root artifact is not used as a merge base for generated code.

The original OneDrive checkpoint, logs, and shared files were left untouched. A second, repository-external backup exists in the migration workspace under `migration-backup/u302-clean-20261010/`.

## Repository layout

| Path | Purpose |
| --- | --- |
| `battle.html` | Verified public battle artifact; generated from `battle-dev/dist/battle.html` |
| `battle-dev/` | Preserved source, tests, build scripts, reports, measurements, and Claude Code definitions |
| `battle-dev/coordination/` | Current checkpoint pointer, resume state, work queue, capability notes, and governing prompt |
| `AGENTS.md` | Codex and repository-wide Git safety rules |
| `CLAUDE.md` | Claude Code entry point and branch boundary |
| `scripts/finish-work.ps1` | Test -> commit -> push workflow |
| `scripts/setup-worktrees.ps1` | Idempotent worktree setup for Codex and Claude Code |
| `.github/workflows/battle-ci.yml` | Pull-request and agent-branch verification |

## Branch and worktree map

| Actor | Local worktree | Write branch | Reads |
| --- | --- | --- | --- |
| Codex | `worktrees/codex` | `codex/work` | root `AGENTS.md`, `battle-dev/AGENTS.md`, coordination files, source/tests |
| Claude Code | `worktrees/claude` (open its `battle-dev/` as the Claude project) | `claude/work` | root `CLAUDE.md`, `battle-dev/CLAUDE.md`, preserved `.claude/`, coordination files |
| ChatGPT | GitHub repository / pull requests | no direct write branch by default | `main` for accepted code; agent branches or PR diffs for in-progress code |
| Integrator | `repo-main` | `integration/github-migration` or another `integration/*` branch | both agent branches and CI evidence |

`main` is the accepted, reviewed state. Agent branches are the latest work-in-progress state and may temporarily differ.

## Normal task flow

1. Fetch without overwriting local work.
2. Confirm the current branch and read the coordination documents.
3. Edit only the owning worktree and battle scope.
4. Run `.\scripts\finish-work.ps1 -Message "..."`.
5. Open a pull request to `main` after the branch is pushed.
6. Merge only when the `Battle verification` CI job succeeds and the diff has been reviewed.

The finish script never force-pushes. Failed validation leaves the working changes uncommitted. A failed push leaves the successful local commit available for a later retry.

## Recovery

- Do not reset or delete work to resolve a push rejection.
- Run `git fetch origin`, inspect `git status`, `git log --graph --oneline --decorate --all`, and compare the remote branch before integrating.
- If a worktree is damaged, the repository-external U302 backup and GitHub agent branch are separate recovery sources.
- The legacy OneDrive shared directory remains a read-only historical fallback until the migration pull request is accepted.
