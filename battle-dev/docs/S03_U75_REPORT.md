# S03-U75 targetImmune() cache-poisoning preventive fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u74_worm_xex_battleproof_fix_20260919.zip` (Claude, U74).

## Why this unit

After U74 fixed a real, live cache-poisoning bug in `battleProof()`, per fixed fallback priority #1/#6 (the
same bug class just confirmed in the prior unit, in an unaudited area) this unit audits every other
name-keyed cache in the engine for the identical architectural shape, before returning to card-level work or
further sweeping.

## Audit

Every `_CACHE = new Map()` in the engine was checked:

- **`TARGET_IMMUNE_CACHE`** (`targetImmune()`, `engine/00_state_actions.js`) — **the exact same shape as
  `battleProof()`**. It scans `continuousSources()` for a dynamic `continuous.immuneToTarget(card, src)`
  check; if the loop finds no match, it falls through unconditionally to a per-card-NAME cache populated by a
  blind regex match (`/このカードは[^。]*効果の対象にならない/`) against the card's raw OCG text. A card with a
  *conditional* self-targeting-immunity clause would still have that phrase in its raw text (describing the
  condition), so the same poisoning scenario applies.
- `MAT_SPEC_CACHE`, `ACT_ZONE_CACHE`, `FIELD_ACT_CACHE` (`engine/20_effect_primitives_ex.js`) — audited and
  confirmed **not vulnerable**. None of them consult a live-game-state-dependent `continuous.*` check before
  falling back to their cache; `hasFieldActivatableEffect` in particular always returns from inside its own
  `if(sc){...}` branch when a script exists, never falling through to the cache in that case. These caches
  are purely static (parsed once from card text/script shape, no per-duel-state dependency), so they cannot
  be poisoned the way `battleProof()`/`targetImmune()` could.

## Live-bug check

Unlike `battleProof()` (which had two real, already-live self-scoped conditional declarations —
カラクリ守衛 参壱参 and this session's own ワーム・ゼクス), every currently-declared `continuous.immuneToTarget`
in this codebase (ロード・オブ・ドラゴン－ドラゴンの支配者－, ホルスのしもべ, メタルシルバー・アーマー,
ライトロード・ドルイド オルクス) is `scope:'allMonsters'`, protecting *other* cards, not itself — so this was
**not yet a live bug**, only the identical latent trap. Fixed preventively before any future card combines a
self-scoped conditional `continuous.immuneToTarget` with matching raw text.

## Fix

`engine/00_state_actions.js`, `targetImmune(card)`: mirrors the exact `battleProof()` fix from U74 — a card
whose own script declares `continuous.immuneToTarget` as a function has already had its authoritative answer
computed by the `continuousSources()` scan above (returning `false` to reach this point); that answer is now
trusted as final, and the cache/text-inference fallback is skipped for such cards. No currently-declared
card's behavior changes (confirmed via `s03_status_audit.py`: zero status changes from this unit).

```js
if(sc0 && sc0.continuous && typeof sc0.continuous.immuneToTarget === 'function') return false;
```

## Dedicated test

`node tools/test_s03_u75_target_immune_cache_fix.js` — 1 assertion, passes. Since no real declared card
currently combines the vulnerable shapes, the test directly exercises the real, production `targetImmune()`
function: it pre-poisons `TARGET_IMMUNE_CACHE` for a real card name (`カラクリ守衛 参壱参`, already TESTED,
S03-U71) to `true` — exactly reproducing the scenario `battleProof()` exhibited live — then temporarily
declares a synthetic self-scoped `continuous.immuneToTarget` returning `false` on that same card's real
script object (explicitly documented as a regression fixture only, not a real implementation of any actual
clause on that card), and confirms `targetImmune()` correctly returns the real dynamic answer (`false`)
rather than the poisoned cached value (`true`).

## Coverage / status audit

- `python tools/script_coverage.py`: unchanged from U74 (`TESTED` 2121, `PARTIAL` 172) — no new card
  declarations.
- `python tools/s03_status_audit.py`: EXIT 0, 76 declared status changes (unchanged), **off-target status
  changes = 0**.

## Gate

- `python tools/check.py` — EXIT 0, **13121 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations. Includes `tools/test_auto_cycle23.js` (the pre-existing dedicated
  test for all four currently-declared `continuous.immuneToTarget` cards), confirming no regression to any of
  them.

## Real-duel measurement

None of the four cards currently declaring `continuous.immuneToTarget` are on any `1103_MAJOR_DECKS_v1` fixed
list, and this fix changes behavior for no currently-declared card (confirmed by the zero-diff status audit)
— an R1 sweep would not exercise the changed code path at all, so none was run for this unit. The existing
Full Gate (including `test_auto_cycle23.js`) is this unit's complete evidence.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`d8c6894ce6a9e75360b792eabfa2a90bec0ffa7c7470b97f26fb2a392a7cd723` (798 files).

## Remaining

- None specific to this bug class — the static audit confirmed the only other vulnerable cache
  (`TARGET_IMMUNE_CACHE`) is now fixed, and the three other name-keyed caches in the engine are structurally
  immune to this pattern.
- Per the fixed fallback order, continuing directly into the next Requirement.
