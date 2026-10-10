# 1103 GitHub collaboration rules

## Scope

- Battle development lives under `battle-dev/`.
- The published browser artifact is root `battle.html`; it must be byte-for-byte identical to `battle-dev/dist/battle.html` after a verified build.
- The existing deck builder and rulings assets at repository root are out of scope. Do not change `index.html`, `carddata.json`, `official-current.js`, `rulings-data.js`, `rulings.html`, `tournaments.json`, `wiki-rulings.js`, `sw.js`, `manifest.webmanifest`, `images/`, or `icons/` unless the user explicitly expands the task.

## Required context

Before battle work, read:

1. `battle-dev/AGENTS.md`
2. `battle-dev/coordination/LATEST.md`
3. `battle-dev/coordination/CLAUDE_RESUME.md`
4. The relevant workflow instructions under `battle-dev/.claude/skills/battle-dev/`

The preserved historical workflow remains authoritative for gameplay implementation and validation. GitHub replaces the old OneDrive handoff as the collaboration transport; it does not relax any battle validation rule.

## Branch ownership

- Codex writes only to `codex/work` (or a short-lived `codex/*` branch created from it).
- Claude Code writes only to `claude/work` (or a short-lived `claude/*` branch created from it).
- Migration/integration work uses `integration/*`.
- Never commit directly to `main`. `main` receives verified changes through a reviewed pull request only.
- Never force-push, hard-reset, rewrite published history, or delete another agent's branch.
- Each agent uses its own Git worktree. Do not point Codex and Claude Code at the same writable directory.

## Completion contract

- Do not hand-edit generated `battle-dev/dist/*.html` or root `battle.html`.
- Run the repository completion command from the worktree root when a coherent change is ready:

  ```powershell
  .\scripts\finish-work.ps1 -Message "type: concise description"
  ```

- The command runs the safety scan, build, full gate, Acode build, synchronizes root `battle.html`, commits only after success, and pushes the current branch.
- If validation fails, no commit is created. If push fails, the local commit is deliberately retained.
- A task is not complete merely because a local test passed; report the commit SHA, branch, gate result, and push result.

## Security and preservation

- Never commit API keys, credentials, `.env` files, private keys, archives, generated scratch logs, or files larger than the repository safety limit.
- Preserve failing tests and historical progress records. Update current-state documents rather than erasing history.
- Do not use destructive Git commands. Resolve divergence with fetch, review, merge/rebase only when the user has authorized that integration.
