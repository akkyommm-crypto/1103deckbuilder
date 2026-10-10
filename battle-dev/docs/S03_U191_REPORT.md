# S03-U191 — 極星 (ヴァルキュリア, デックアールヴ, リョースアールヴ, ドヴェルグ, グルファクシ, ガルム, ミーミル)

## Findings
Seven 極星 cards had scripts (IMPLEMENTED) but no dedicated test. Two defects:
- **極星宝 cards passed as 「極星」 monsters.** The shared filter `v380IsNordic` matches any name containing 極星, so the Spells and Traps passed it
  too. The effect:
  - ヴァルキュリア could banish a 極星宝 Spell as one of its 2 「極星」 monsters;
  - デックアールヴ could add one from the GY;
  - リョースアールヴ offered hand Spells as monsters to special summon.
- **ドヴェルグ was implemented as two optional triggers, which doesn't match the text.**
  - ① 「召喚に成功したターン、通常召喚に加えて1度だけ…」 is not an activated effect. It could be skipped, or negated on the chain.
  - ② could be cancelled, and it also fired when the card was discarded from the hand. The text says 「フィールド上に表側表示で存在するこのカードが墓地へ送られた時」.

## Fixes
- `v380IsNordicMonster` (cards/38): used by ヴァルキュリア (condition and cost), デックアールヴ and リョースアールヴ.
- ドヴェルグ (cards/39):
  - ① the NORMAL_SUMMON reducer grants the extra 「極星」 summon when a script declares `grantExtraNormalOnSummonS03`, once per turn
    (engine/00). `extraNormalSummonKeyV370` reads it as before.
  - ② is a forced trigger that targets a 極星宝 card in the GY. It fires only when this card left the field face-up this turn (graveInfo).

## Cards (IMPLEMENTED → TESTED)
極星天ヴァルキュリア, 極星霊デックアールヴ, 極星霊リョースアールヴ, 極星霊ドヴェルグ (fixed); 極星獣グルファクシ, 極星獣ガルム, 極星天ミーミル (scripts
unchanged, now tested).

## Tests
`tools/test_s03_u191_nordic.js` 22/0 (real DUEL paths, Replay-audited).
- ヴァルキュリア: its cost with a Spell in the hand.
- デックアールヴ / リョースアールヴ: through a Tribute Summon and a Normal Summon.
- ドヴェルグ:
  - the extra summon is offered with no chain;
  - it is destroyed by ブラック・ホール;
  - it is discarded as the ライトニング・ボルテックス cost.
- グルファクシ: its procedure.
- ガルム: the attacked monster returns to the hand.
- ミーミル: real turn transitions to both Standby Phases.

Negative control on U190: 3 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15008 PASS / 0 FAIL** (= U190 14986 + 22 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U190.
- Coverage: TESTED 2378, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 46, GENERIC_OK 644, PARTIAL 121 (4996); audit 339 declared, 0 off-target.
