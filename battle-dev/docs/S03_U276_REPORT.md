# S03-U276 — 6 cards (ドッペル・ゲイナー, クリボーを呼ぶ笛, ダーク・アイズ・イリュージョニスト, エレキトンボ, マジック・キャンセラー, デルタ・アタッカー), ENGINE_GAP re-check 4

## Workflow (mixed, Sonnet battle-implementer owns the unit; no engine change)
- One Sonnet subagent wrote the cards, the test, the declarations, the status-record edits and ran the gate; the parent (Opus) publishes.
- All six ENGINE_GAP overrides are removed. Nothing in `engine/` changed: every card reuses an existing capability.

## Cards → TESTED (2011 texts) — cards/HZZZZZE_claude_s03_u276_gap4.js
- **ドッペル・ゲイナー** (Continuous Trap): the activation does nothing; while face-up it is a forced effect applied each time its controller takes effect damage whose source is a monster on the opponent's field (`onLPChange` cause effect + `sourceUid`); the opponent takes the same amount.
- **クリボーを呼ぶ笛** (Quick-Play): choose 1 クリボー / ハネクリボー in the Deck at resolution (not a target), then add it to the hand (`API.searchDeck`) or Special Summon it (`specialSummonPositionsS03`). Each option is offered only when possible (free Zone and Special Summons allowed / no Deck-to-hand lock); not activatable when neither is possible.
- **ダーク・アイズ・イリュージョニスト:** forced Flip effect, target chosen at activation (any monster on the field); `continuous.cannotAttack` while it is face-up. Link = `stLinkTargetS03` on it + a `linkV9` watch mark on the target (both zone-local).
- **エレキトンボ:** deck trigger (`declareDeckTriggerS03`, optional): destroyed by the opponent (battle or card effect) → Special Summon 1 「エレキ」 (GROUP.WATT) monster from the Deck, face-up Attack or Defense.
- **マジック・キャンセラー:** `activationLockS03` (no Spell card activation by either player) + continuous `negateSpell` (all Spell effects on the field).
- **デルタ・アタッカー** (Spell): exactly 3 face-up non-Token same-name Normal Monsters; at resolution their uids are recorded; the used card lingers for the turn (`API.lingerS03`) with `grantsDirectAttack`.

## Rulings chosen
- ドッペル・ゲイナー: the source monster must be in the opponent's Monster Zone when the damage happens (Opus ruling). A monster that released itself as the cost is in the GY then: not mirrored.
- デルタ・アタッカー: 「3体存在する」 is read literally as exactly 3 (4 or more of one name: not activatable).
- エレキトンボ: the Special Summon position uses the deck-trigger engine's face-up Attack / Defense choice (same two options as `specialSummonPositionsS03`).
- ダーク・アイズ・イリュージョニスト: the target may be any monster on the field (including a face-down one and itself).

## Existing tests adjusted (status records; no behavior assertion changed)
Each check becomes an "unlocked" check (`!ov[n]`) with the comment `S03-U276: implemented and tested; kept as a record`, and every count is unchanged:
`test_v540_batch06` (ドッペル・ゲイナー), `test_v500_batch02` (クリボーを呼ぶ笛), `test_v570_batch09` (ダーク・アイズ・イリュージョニスト), `test_v560_batch08` (エレキトンボ), `test_v590_batch11` (マジック・キャンセラー), `test_v580_batch10` (デルタ・アタッカー).

## Tests
`tools/test_s03_u276_gap4.js` passes 101/0, on real DUEL paths (activation, chain windows, attacks, Flip Summon through the processor) and Replay-audited; every card has negatives.

Negative control on U275: 46 FAIL (the checks fail; no crash).

## Opus review (2026-10-03 TESTED rule)
- ドッペル・ゲイナー, クリボーを呼ぶ笛, ダーク・アイズ・イリュージョニスト, エレキトンボ and マジック・キャンセラー are accepted as TESTED, each with its basis above.
- **デルタ・アタッカー is declared PARTIAL, not TESTED.**
  - The script implements exactly 3 same-name Normal Monsters.
  - Whether 4 or more allow the activation (and which 3) is an open ruling.
  - The override reason records it, and the `test_v580_batch10` record checks PARTIAL; its count is unchanged.
- After this data change the pre-scan + gate were re-run by the parent.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17394 PASS / 0 FAIL** (= U275 17293 + 101 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U275.
- Coverage: TESTED 2875, ENGINE_GAP 516, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 837 declared, 0 off-target.
- Published in the batched checkpoint S03-U276–U279.
