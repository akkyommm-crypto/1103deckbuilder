# Claude Code entry point

This repository contains the existing 1103 battle project under `battle-dev/` without replacing the deck builder at repository root.

Before editing, read `AGENTS.md`, `battle-dev/CLAUDE.md`, `battle-dev/AGENTS.md`, `battle-dev/coordination/LATEST.md`, and `battle-dev/coordination/CLAUDE_RESUME.md`. The existing `.claude` agents and `battle-dev` skill are preserved at `battle-dev/.claude/`; open `battle-dev/` as the Claude Code project when those project-local definitions are needed.

Claude Code owns `claude/work`. Do not edit from the Codex worktree, do not commit directly to `main`, and do not modify the deck builder/rulings files listed as out of scope in `AGENTS.md`.

At a coherent stopping point, run the required verified completion command from the worktree root:

```powershell
.\scripts\finish-work.ps1 -Message "type: concise description"
```

The command must succeed before the work is reported as committed and pushed. A push failure leaves the local commit intact for retry.

For an intermediate development checkpoint, `finish-work.ps1 -AsyncGate -Message "..."` may be used after the unit's dedicated/nearby/negative-control validation. It pushes a quick-gate checkpoint so GitHub Actions can run the authoritative full gate without blocking further development. Do not call that commit fully verified, integrate it, or publish it until the exact SHA's `verify-battle` job is green. Release candidates continue to use the blocking full gate; `-ParallelGate` runs the same `tools/check.py` Node command set with bounded parallel workers.
