# S03-U120 — Extra Deck tier: 氷結界の龍 ブリューナク, A・O・J カタストル, インヴェルズ・ローチ, No.39 希望皇ホープ

## Why
Fresh cross-reference (U118 coverage × 13 major deck lists): the highest-count non-TESTED cards are Extra Deck monsters —
カタストル (10 decks), ローチ (9), ブリューナク (8), ホープ (7), all IMPLEMENTED with no real-path test. Measured on U119:
1. **ブリューナク**: the discard *cost* was done at resolution, by the hand index remembered at activation. Negated →
   no cost paid; a hand change during the chain → the wrong cards discarded.
2. **ホープ**: clause ② ("X素材の無い状態で攻撃対象に選択された場合に発動する。このカードを破壊する。") did not exist.
   Implementing it exposed two engine gaps: the attack-declaration trigger batch dropped every `quickEffect` card (so a
   mandatory trigger of such a card was only offered as an optional POINT response), and a `detachCostS03` function
   returning `null` (no cost for this activation) made the delegating `cost()` fail ("コストを払えません").
3. **カタストル** used the printed attribute (`dbOf(foe).at`), not the current one.

## Changes
- `cards/00_generic_core.js` ブリューナク: `cost` = choose 1..min(hand, opponent cards) and discard at activation
  (`requestChoiceV49` min/max); `selectTargets` = exactly that many opponent cards; `resolve` re-locates each target.
- `cards/30_themes_b.js` ホープ: `detachCostS03(ctx)` (null in ② mode), ② branch in condition/resolve,
  `forcedForEventS03(eventName, ctx)`; helpers `xyzTargetWithoutMaterialS03`, `hopeSelfDestroyModeS03`.
  カタストル: `s03CatastorAttrU120` = `currentAttributeV17`.
- `engine/30_processor_chain_battle.js`: the attack declaration (and replay retarget) records
  `pendingAttack.targetNoMaterialS03` — only when the target is an Xyz monster with no material (no digest change for
  other attacks). The attack-declaration trigger batch keeps a quickEffect card whose trigger is forced.
- `engine/00_state_actions.js` `ATTACK_PENDING_RETARGET_S03`: sets / clears `targetNoMaterialS03`.
- `engine/1ZB`: `forcedForEventS03(eventName, ctx)` (second argument added; existing hooks ignore it).
- `engine/40` delegating `cost()`: a function `detachCostS03` returning null = no cost (done(true)).
- ② mode is unambiguous: if ホープ had no material when it was selected, ① cannot be activated; ① using the last
  material on an attack on itself does not trigger ② (tested).

## Test — `tools/test_s03_u120_extra_tier.js` 30/0 (real DUEL path, Replay-audited)
- A ブリューナク: cost choice 1..3; 2 chosen cards discarded before the chain link exists; exactly 2 targets; both
  returned; the non-target stays; once per turn.
- B ブリューナク negated by 天罰: the discard stays paid, the target stays, ブリューナク destroyed.
- C カタストル: attacking / attacked by non-DARK → destroyed without damage; DARK → normal battle; face-down → no
  effect; a monster turned DARK (`API.setAttribute`) → not affected.
- D ローチ: negates サイバー・ドラゴン's Level 5 procedure summon (1 material detached); not listed for BF－疾風のゲイル (Lv3).
- E ホープ: ① at the real attack-declaration POINT; ② destroys it (chain link) when targeted with no material; ① with
  the last material on itself does not trigger ②.
- Negative control on the U119 build: A, B, C (attribute), E② fail.
- Related tests re-run on the U120 build (43 files: ホープ / ローチ / ブリューナク / カタストル / attack declaration /
  pendingAttack / detach cost / quickEffect / forcedForEvent): 0 FAIL.

## Status
- 4 cards IMPLEMENTED → TESTED. TESTED 2176 → 2180, IMPLEMENTED 117 → 113.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 13812 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `278f8b87b8be715034a9f77a13299d30e290d742ed7946f6864c300748568bf4`; Acode not regenerated (`dist/battle_acode.html` `c0bfdbba…`).
- Coverage: TESTED 2180, IMPLEMENTED 113, ENGINE_GAP 609, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1278 (4996);
  135 declared status changes, 0 off-target.
