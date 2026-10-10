# S03-U115 — capability: "unaffected by Spell/Trap card effects" (禁じられた聖槍, E・HERO ワイルドマン, 力の代行者 マーズ)

## Why
禁じられた聖槍 (fixed list rabbit x2, status IMPLEMENTED) set a `spearProof` flag that no code ever read: the
"このカード以外の魔法・罠カードの効果を受けない" half did nothing. Measured on the U114 build: a lanced monster was still
destroyed by the opponent's サンダー・ボルト / 地砕き (also when the lance was chained in response), still got
暗黒界の門's +300, and was still negated by スキルドレイン. Base: clean U114 (`30093a64…`).

## Capability (`engine/1ZG_unaffected_by_st_s03.js`)
- Effect source: while a chain link resolves, `act()` stamps affecting FX_* actions (destroy/send/banish/bounce/return,
  control, stat/level/characteristic mods, negation, position, card flags, protection grants, equip, v4 stat modifiers,
  detach, wipe) with `srcS03 = {uid, k}` of the resolving card (`RESOLVING_LINK_S03`). Stored in the journaled Action →
  Replay decides identically. Costs are not stamped (they are paid during activation).
- Reducer (`applyAction`): an affecting action whose target is unaffected by its source changes nothing and logs
  「…は魔法/罠カードの効果を受けない」; `FX_WIPE_ZONE` spares such cards individually. A card is never unaffected by
  its own effects.
- Continuous: `collectContinuous` (stat layers) and `effectNegatedBy` (continuous negation) skip a Spell/Trap source for
  a card unaffected by it.
- Declarations: `card.spearProofS03 = {turn, srcUid}` (禁じられた聖槍; that turn only; the lance itself is exempt;
  zone-local) and script hook `unaffectedByS03(card, src, gs)`.

## Consumers
- 禁じられた聖槍: now sets `spearProofS03`; re-checks its target at resolution.
- E・HERO ワイルドマン (ENGINE_GAP → TESTED): unaffected by Traps while face-up in the Monster Zone (location read from the
  state being reduced).
- 力の代行者 マーズ (ENGINE_GAP → TESTED): unaffected by Spells; +LP difference ATK/DEF with its own face-up 天空の聖域.
- Both ENGINE_GAP override reasons named exactly this capability; overrides removed, and the batch tests that pinned them
  (v550 batch07, v670 batch19) moved them to an "Unaffected unlocked" list (repository convention).
- Deferred same-shape cards (another part of their text needs a separate capability): トラファスフィア, 伝説のフィッシャーマン,
  サイレント・ソードマン LV5, サイレント・マジシャン LV8, 砂塵の結界, 暴君の威圧, 最後の進軍, 極神聖帝オーディン, 儀式魔人ディザーズ.

## Test — `tools/test_s03_u115_forbidden_lance_immunity.js` 28/0 (real DUEL path, Replay-audited)
- A: lance −800 applies; the opponent's サンダー・ボルト destroys the other monster only; 地砕き cannot destroy it.
- B: chained in response to サンダー・ボルト, the lance resolves first → the monster survives.
- C: 暗黒界の門 +300 no longer applies to the lanced Fiend (the other Fiend keeps it); スキルドレイン does not negate it.
- D: a MONSTER effect (サンダーエンド・ドラゴン) still destroys it; next turn the immunity is gone and ATK returns.
- E: ワイルドマン vs Trap サンダー・ブレイク (survives) / Spell サンダー・ボルト (destroyed) / face-down (affected).
- F: マーズ vs Spell (survives) / Trap (destroyed); 天空の聖域 LP-difference bonus and its negative cases.
- Negative control on the U114 build: A–D fail.

## Status
- E・HERO ワイルドマン, 力の代行者 マーズ ENGINE_GAP → TESTED (#117, #118). ENGINE_GAP 612 → 610, TESTED 2161 → 2163.
- 禁じられた聖槍 stays IMPLEMENTED in this unit (its promotion is left to a later unit with a registered focus test).

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 13658 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `bc4988a6cfbcbd567c1d25169e8b1be3329f601cf9f068fbed763bfb1f2c9ff6`; Acode not regenerated
  (`dist/battle_acode.html` = U114 build `c0bfdbba…`).
- Coverage: TESTED 2163, ENGINE_GAP 610, IMPLEMENTED 123, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1284 (4996);
  118 declared status changes, 0 off-target.
