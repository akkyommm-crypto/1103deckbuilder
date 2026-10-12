# S03-U329 — 「紫炎」 参謀 / 寄子 / 老中 エニシ and ヴォルカニック・ハンマー

Base: `claude/work` `cbc8cb6` (U328, gate 19006 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZQ_claude_s03_u329_shien.js`)
- 参謀: forced Normal Summon trigger (a face-up 六武衆 must be on my field); the Race is declared at resolution (`u329.race-declare`, stored as the card flag `u329Race`); `continuous.cannotAttack` for every monster of that current Race and the card's `specialSummonLockS03` (both players).
- 寄子: the lingering pattern of 蒼天のジェット (S03-U257): quick effect from the hand at the damage calculation of a battle with a 六武衆 of mine; the used card protects from battle destruction exactly the 六武衆 of that battle, that turn.
- エニシ: hand Special Summon procedure (cost banish two 六武衆 from the Graveyard); once per turn destroy a chosen face-up monster of either side, `cannotAttackTurn` set at activation.
- ハンマー: once per turn burn = 200 × the monsters named ヴォルカニック in my Graveyard, `cannotAttackTurn` set at activation.
- Left: ヴォルカニック・バックショット (the second clause needs ブレイズ・キャノン), クイーン, デビル, 紫炎の霞城 (Spell).

## Tests
- `tools/test_s03_u329_shien.js` 17 / 0 (declared Race: attack ban + 死者蘇生 revive blocked / control revive; the lingering protection and its negative; procedure, destruction, count burn; Replay audits). Negative control on the previous build: 11 FAIL. Coverage TESTED 3029 → 3033, NOT_STARTED 818 → 814; audit 0 off-target.
- Authoring note: `battleAttackersV29` only answers in the Battle Phase (call `phase('battle')` first).
