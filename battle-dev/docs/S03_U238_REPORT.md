# S03-U238 — 「フォーチュンレディ」 (ENGINE_GAP 1, PARTIAL 1, NOT_STARTED 4)

## Workflow
- opus-only: three engine additions and a family with an ENGINE_GAP card.
- Written in its own tree while the Sonnet subagent worked on U237, then rebased onto U237 (engine edits re-applied as patches).

## Engine
- `engine/00` `noteLevelUpS03`: 「このカードのレベルが上がった時」.
  - A face-up monster whose level rises through a level Action (`LEVEL_MOD_V16`, or `FX_SET_STATE lvDelta`) queues `onLevelUpS03 {uid, player, from, to}` in a DUEL.
  - It is drained like the other deferred events. The name is listed in engine/40 `EVENTS`.
- `engine/00` `noteLeftFieldByEffectS03`: 「効果でフィールドから離れた時」.
  - The leave event has no cause, so the move reducers stamp the card itself with `card.leftFieldByEffectS03 = {turn, face, from}`.
  - The stamp comes from the action's P3 cause (`reason 'effect'`), so costs, battle, materials and rules do not count.
  - Covered moves: to the GY, to the hand, to the Deck, banish, destroy-and-banish.
  - It is set through the central `v350BanishWhenLeavesField` hook and `FX_BANISH` / `FX_DESTROY_BANISH`.
- `FX_SPECIAL_SUMMON` `opts.summonSrcS03` → `card.summonSrcS03 = {name, turn}` (zone-local): 「「X」と名のついたカードの効果によって特殊召喚」.
  - It is opt-in, set only by the summoning card's script, so no other summon's state changes.

## Cards → TESTED (2011 texts) — cards/HZZZR_claude_s03_u238_fortune_lady.js
Common helper:
- ATK / DEF = current Level × N (continuous `setBaseAtk` / `setBaseDef`);
- at its controller's Standby Phase, Level +1 up to 12 (forced, `LEVEL_MOD_V16`, kept while on the field).

| Card | Was | Effect |
|---|---|---|
| アーシー | ENGINE_GAP | ×400; its level rises → 400 damage. The entry is removed from `data/script_status_overrides.json`. |
| ウインディー | NOT_STARTED | ×300; Normal Summon → destroy up to (own 「フォーチュンレディ」 count) opponent Spell / Trap cards (optional, chosen) |
| ウォーテリー | NOT_STARTED | ×300; special summoned while another 「フォーチュンレディ」 is on its field → draw 2 |
| ダルキー | NOT_STARTED | ×400; own 「フォーチュンレディ」 destroys an opponent monster by battle → revive a 「フォーチュンレディ」 from the GY (optional, targeting) |
| ファイリー | NOT_STARTED | ×200; special summoned face-up in Attack Position by a 「フォーチュンレディ」 card's effect → destroy a face-up opponent monster and deal its ATK |
| ライティー | PARTIAL | ×200; leaves the field face-up by an effect → special summon a 「フォーチュンレディ」 from the Deck (optional). Replaces the AUTO table's coarse ignition recruit; a `poolSpecS03` (set FORTUNE_LADY) is registered and `test_s03_u135` still passes. |

## Existing test adjusted (status record; no behavior assertion changed)
`tools/test_v910_batch42.js` listed フォーチュンレディ・アーシー among the reviewed ENGINE_GAP overrides.
- This unit implements the card and removes that override, so the first pre-scan stopped the gate (1 FAIL).
- Following the S03-U214 precedent (次元の裂け目 in batch43), the card moves to a `levelUpUnlocked` check, which asserts that the override is gone.
- The PASS count (30) is unchanged.

## Tests
`tools/test_s03_u238_fortune_lady.js` passes 20/0, on real DUEL paths and Replay-audited.
- アーシー:
  - no level-up at the opponent's Standby Phase;
  - at its own → Level 7, 2800, 400 damage;
  - at Level 12, neither.
- ウインディー destroys exactly the chosen Set card.
- ウォーテリー draws 2 only with another 「フォーチュンレディ」.
- ライティー destroyed by the opponent's 地割れ → ファイリー from the Deck in Attack Position → 青眼 destroyed, 3000 damage.
- ライティー destroyed by battle → no summon.
- ダルキー's battle → ライティー revived.

Other checks:
- `test_s03_u135` still passes.
- All tests naming フォーチュンレディ / level mods / leave-banish, plus the U162 and U180–U184 tests, `test_s03_u214` and `test_battle_cards`: 0 FAIL.
- Negative control on U237: 9 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15977 PASS / 0 FAIL** (= U237 15957 + 20 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U237.
- Coverage: TESTED 2692, ENGINE_GAP 597, NOT_STARTED 1031, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 652 declared, 0 off-target.
