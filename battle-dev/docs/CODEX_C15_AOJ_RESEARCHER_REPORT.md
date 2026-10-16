# CODEX-C15 — no-Flip-effect position transition / A・O・J リサーチャー

Base: published `main` at `7d4c61f` on the isolated `codex/flip-suppress-position` branch. Claude's worktree and branch were not edited.

## Engine change

- Added `API.flipFaceUpWithoutFlipEffect`, a generic journaled transition from face-down to face-up that intentionally omits the `v10FlipEffect` marker and therefore emits `onPositionChange` without emitting `onFlip`.
- Replaced the card-local direct action in `VW－タイガー・カタパルト` with the shared API.
- The existing `API.flipFaceUpByEffect` remains unchanged and continues to emit `onFlip` for effects that do activate Flip effects.

## Card change

- Implemented `A・O・J リサーチャー`: once per turn, discard one card, target one opponent face-down Defense Position monster, and turn it face-up Attack Position without activating its Flip effect.
- Target legality is checked both when activating and when resolving.

## Validation

- The dedicated test was first run against the previous generated build and failed 7 assertions without crashing, establishing the negative control.
- `tools/test_codex_c15_aoj_researcher.js` covers the real DUEL activation path, cost, target filtering, resolution recheck, once-per-turn limit, the ordinary effect-flip negative control, and Replay equality.
- Existing `VW－タイガー・カタパルト` and System v10 position tests remain regression gates.
