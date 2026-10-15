# CODEX-C10 — phase-end priority windows

Base: pushed CODEX-C09 (`28ddd94`) on the isolated `codex/phase-priority` branch. Claude's worktree and branch were not edited.

## Scope and result

Resolved the open engine gap that prevented the non-turn player from activating legal Fast Effects in otherwise open Draw, Standby, Main, and End Phase states. This is the real UI-path cause behind the user report that a previously Set `安全地帯` could not be activated during the opponent's turn.

## Implementation

- Before an ordinary Draw / Standby / Main Phase transition, the processor now opens a serializable `phaseEnd` POINT with turn-player priority. Players with no legal Spell Speed 2 action auto-pass under the existing ADS `Available` behavior.
- Before the End Phase commits the turn, the TURN processor opens the same POINT before hand-limit and turn-end processing.
- A chain started from the window reopens the same window after resolution; after both players pass, the original PHASE or TURN request continues exactly once.
- Effect-forced and internal `force` phase transitions are unchanged. Existing Battle Phase Start / Battle Step windows remain authoritative for Battle Phase timing.
- The continuation is plain processor data, so Save/Resume and Replay require no new save format.

## Validation

- Negative control on CODEX-C09 failed the new real phase-end, End Phase, and Save/Resume assertions. It only offered `安全地帯` after the game had already entered the Battle Phase.
- `tools/test_codex_c10_phase_priority.js` covers opponent-Main activation of `安全地帯`, an empty-window auto-pass negative control, opponent-End activation before turn change, saved POINT restoration, saved continuation execution, and Replay audits.
- Nearby Safe Zone, Battle Start, end-Battle-Phase, hand-limit resume, POINT-window resume, and journaled End Phase tests pass.
- Coverage was refreshed before selecting the gap: `ENGINE_GAP 464`, `TESTED 3163`, `NOT_STARTED 692`, `TOTAL 4996`. CODEX-C10 fixes a shared play-path gap; it does not falsely reclassify unrelated card entries.
- Full repository gate is run before commit.
