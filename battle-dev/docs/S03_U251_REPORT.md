# S03-U251 — LV monsters: サイレント・ソードマン LV3 / LV5 / LV7, ホルスの黒炎竜 LV4 / LV6 / LV8

## Workflow
- opus-only, because it is engine work. Three of the six cards were ENGINE_GAP, and two of those reasons were out of date:
  - LV3: the targeting negation of engine/1T exists since S03-U28;
  - LV5: the unaffected capability of engine/1ZG exists since S03-U115.
- The tree was built on U249 while U250 ran, then rebased onto U250 (`rebase_unit.py`).

## Engine
- **Spell negation (engine/1ZH).** A face-up monster can declare continuous `negateSpell(card, self)` (LV7: 「フィールドの魔法カードの効果は無効化される」), using the 王宮のお触れ model of S03-U118 for Spells:
  - A Spell link whose card is on the field (Spell & Trap Zone / Field Zone) when it resolves is effect-negated. This covers both Spells activated from the hand and Set ones.
  - The continuous effects of such Spells are dropped from `continuousSources()` (`spellSourcesFilterS03`, applied with the monster sources).
  - Activating a Spell stays legal.
  - The resolution log names Spells correctly.
- **Control lock (engine/00).** `FX_CONTROL` and `CONTROL_SWAP_V26` change nothing for a face-up monster whose script declares `controlLockS03(card)` and whose effect is not negated. The effect itself still resolves. Used by Horus LV4.
- **Two reducer records (engine/00).** Both are zone-local:
  - `card.directBattleDamageTurnS03`: the attacker dealt battle damage by a direct attack (set in `emitBattleDamageV6`). Used by LV5.
  - `card.battleKillTurnS03`: the monster destroyed another by battle and is still in the Monster Zone (set in `BATTLE_CLEANUP` from `gs.lastBattle`). Used by Horus LV4 / LV6 and ジュラック・デイノ.
- **Summon condition 「「X」の効果でのみ特殊召喚できる／する事ができる／が可能」 (engine/1ZK).**
  - It is now enforced, including 「…の効果及びこのカードの効果でのみ」. Before, only the 「でしか」 wording was enforced, and 「でのみ」 was only recognised as the proper method.
  - These are special-summon monsters with 蘇生制限: once properly summoned (the S03-U127 record), other effects may summon them from the GY / banished zone (`soft`).
- **ジュラック・デイノ (S03-U250).** Its forced Damage Step mark, an extra chain link, is replaced by `battleKillTurnS03`. The U250 test still passes 33/0: attacker kill, defender kill, and no record for a direct attack or mutual destruction.

## Cards → TESTED (2011 texts) — cards/HZZZZE_claude_s03_u251_lv.js
- **サイレント・ソードマン LV3** (ENGINE_GAP override removed):
  - ① the opponent's Spell targeting it is effect-negated (`declareTargetingNegatorS03`).
  - ② at its own Standby Phase, except on the turn it was summoned, special summoned or flipped: send it to the GY (cost) → LV5 from the hand / Deck.
- **サイレント・ソードマン LV5** (ENGINE_GAP override removed):
  - ① unaffected by the opponent's Spells.
  - ② after battle damage by a direct attack, at the next own Standby Phase: → LV7.
- **サイレント・ソードマン LV7:** summoned only by LV5; it negates the effects of Spells on the field.
- **ホルスの黒炎竜 LV4** (ENGINE_GAP override removed): its control cannot change; a battle kill → at that turn's End Phase, → LV6.
- **ホルスの黒炎竜 LV6:** unaffected by Spells while face-up on the field; a battle kill → LV8.
- **ホルスの黒炎竜 LV8:** summoned only by LV6. It may negate a Spell activation and destroy that card; this is a chain response declared with engine/1P and has no count limit.

Rulings chosen:
- LV3 ①: negates only the opponent's Spells, and is applied when the link is added (engine/1T, effect negation), as for ダーク・ジェネラル フリード.
- LV5 ②: "next own turn" means the first own turn after the record (turn ≤ record + 2).
- Horus LV4 / LV6: the level-up can happen on either player's turn (a defender's kill counts) and is optional (the cost is sending the monster to the GY).
- Level-ups summon in Attack Position.

Left for later:
- A negated Equip Spell that never attaches stays on the field. The usual rule sends it to the GY.
- エレメント・ソルジャー can now use `controlLockS03`.

## Existing tests adjusted (status records; no behavior assertion changed)
`tools/test_auto_cycle12.js` asserted 「ホルスの黒炎竜 LV4 は未実装（コントロール変更耐性の consumer が無い）」. That premise no longer holds, so the check now asserts that the card uses the control lock. The count (149) is unchanged.

## Tests
`tools/test_s03_u251_lv.js` passes 38/0, on real DUEL paths and Replay-audited.
- LV3:
  - the opponent's 月の書 is negated, and its controller's own 月の書 applies;
  - Standby LV-up from the Deck, and none on the summon turn.
- LV5:
  - the opponent's サンダー・ボルト leaves it, and its own ブラック・ホール destroys it;
  - direct attack → next Standby → LV7, which is properly summoned. ミラーフォース destroys it and 死者蘇生 revives it.
  - Not two own turns later.
- LV7:
  - another effect cannot summon it from the hand, and it cannot be Normal Summoned;
  - 山 gives no ATK, and 強欲な壺 of either player draws nothing; controls without LV7 give 3200 / draw 2.
- Horus LV4: 心変わり fails on it and works on ワイト; battle kill → End Phase → LV6; no kill → nothing.
- Horus LV6: ブラック・ホール destroys only ワイト; battle kill → LV8.
- Horus LV8: offered against 強欲な壺, which is negated, destroyed and draws nothing; another effect cannot summon it.

Negative control on U250: 19 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16457 PASS / 0 FAIL** (= U250 16419 + 38 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U250.
- Coverage: TESTED 2761, ENGINE_GAP 569, NOT_STARTED 990, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 721 declared, 0 off-target.
