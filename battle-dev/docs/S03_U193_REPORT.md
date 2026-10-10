# S03-U193 — monsters (6 script fixes)

## Findings and fixes
Nine monsters had scripts (IMPLEMENTED) but no dedicated test. Six did not follow the text.

- **E・HERO バブルマン**
  - Problem: ① (「手札がこのカード1枚のみの場合…特殊召喚できる」) was an effect on the chain, not a summon procedure. ② missed the Flip Summon,
    did not count the Field Zone, and did not recheck at resolution (「発動と処理ができる」).
  - Fix: `summonProcedure`; ② passive on Normal / Special / Flip Summon of itself (`bubblemanAloneS03` covers hand, Monster, Spell &
    Trap and Field Zones), rechecked at resolution.
- **コマンド・ナイト**
  - Problem: 「自分フィールド上に他のモンスターが存在する場合、相手は…攻撃対象に選択する事はできない」 was missing.
  - Fix: `continuous.cannotBeAttackTarget` (engine/1ZU).
- **マシュマロン**
  - Problem: ② fired on any attack against it, face-up too, and was optional.
  - Fix: forced, only when it was face-down when attacked (`battle.flippedUid`).
- **王虎ワンフー**
  - Problem: it destroyed a chosen target among every monster with ATK 1400 or less on the field.
  - Fix: it destroys the summoned monster(s) with ATK 1400 or less. Forced, not targeting.
- **チューニング・サポーター**
  - Problem: its draw fired for any Synchro Material sent while it was in the GY.
  - Fix: it fires only for itself (`eventIsSelfS03`).
- **エレクトリック・ワーム**
  - Problem: it was a Quick Effect, but the text is an ignition effect.
  - Fix: `timing:['mainPhase']`, own turn only (the U190 rule).

## Cards (IMPLEMENTED → TESTED)
The six above, plus ジャンク・ウォリアー, パペット・プラント and トラップ・イーター (scripts unchanged, now tested).

## Tests
`tools/test_s03_u193_monsters.js` 34/0 (real DUEL paths, Replay-audited). Paths used:
- summon procedures;
- a Normal Summon and a Flip Summon;
- an attack on a face-down and on a face-up マシュマロン;
- a Synchro Summon of ジャンク・ウォリアー with チューニング・サポーター as Level 2;
- the End Phase control return.

Negative control on U192: 9 FAIL.

## Left
レベル・スティーラー stays IMPLEMENTED. Its ① (「アドバンス召喚以外のためにはリリースできない」) needs a central path for Tributes made as
costs or by effects, and the engine has none: scripts send the Tributed monsters to the GY themselves. It is recorded on the pending list.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15068 PASS / 0 FAIL** (= U192 15034 + 34 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U192.
- Coverage: TESTED 2397, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 27, GENERIC_OK 644, PARTIAL 121 (4996); audit 358 declared, 0 off-target.
