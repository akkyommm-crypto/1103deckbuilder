# S03-U309 — トゥーン monsters, part 1 (トゥーン・キャノン・ソルジャー, ゴブリン突撃部隊, ヂェミナイ・エルフ, 仮面魔道士)

Base: `claude/work` `810410c` (U308, gate 18291 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Requirement
- Nine トゥーン monsters were NOT_STARTED; they share three clauses and need no new engine work: summon-turn attack ban, direct attack with the own トゥーン・ワールド and no opposing Toon monster, destruction when a トゥーン・ワールド is destroyed. This unit writes the shared helper (`toonCommonS03`) and the four monsters that need no Special Summon procedure; the five with procedures (デーモン, マーメイド, ドラゴン・エッガー, ブラック・マジシャン・ガール, ブルーアイズ・トゥーン・ドラゴン — release cost, 500 LP attack cost, must-attack-Toon rule) are U310.

## Change (`cards/HZZZZZV_claude_s03_u309_toon.js`, unified cards)
- ① no attack on the turn of Summon / Flip Summon / Special Summon: `card.summonedTurn` and `card.flipSummonedTurnS03` (continuous `cannotAttack`).
- ② `canDirectAttack` (not for a negated card): the controller's face-up トゥーン・ワールド and no face-up Toon monster (Type line トゥーン) on the opposing field.
- ③ forced trigger on `onDestroy` of トゥーン・ワールド (either player's, wherever it is); every Toon monster destroys itself.
- キャノン・ソルジャー: ignition, release a monster (itself allowed), 500 damage, no once-per-turn clause. ゴブリン突撃部隊: Defense Position at the end of the Battle Phase after attacking + position lock (the cards/B0 pattern). ヂェミナイ・エルフ: battle damage → the opponent discards at random. 仮面魔道士: battle damage → draw 1.

## Tests
- `tools/test_s03_u309_toon.js` 34 / 0, real Normal / Flip Summon, Battle Phase attacks, サイクロン on トゥーン・ワールド, Replay-audited; negative control on the previous build: 13 FAIL. Coverage TESTED 2933 → 2937, NOT_STARTED 914 → 910; audit 0 off-target.
- Evidence note: `act()` called directly does not start the queued event handling, so the destruction test uses a real サイクロン.

## Not done
- U310: the five Toon monsters with Special Summon procedures. トゥーン・アリゲーター stays GENERIC_OK.
