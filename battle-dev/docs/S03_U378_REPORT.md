# S03-U378 — three targeting / attack lock cards

Base: `claude/work` `d066dca` (U377, gate 20352 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZN_claude_s03_u378_targetlocks.js`)
- Helper `u378Source()`: the effect's source card while an activation is being prepared (`ACTIVATION_PREP_S03.uid` / `.player`), read for the immunity checks of `continuous.immuneToTarget`.
- ヴァイロン・セグメント (Equip Spell, `u312Define`): the equipped monster is not targetable by the OPPONENT's Trap or Effect Monster effects (source kind from carddata: `t`, or `m` with 効果); the Vylon Deck search when sent face-up from the field is shared with the other Vylon equips.
- 闇の侯爵ベリアル: `continuous.cannotBeAttackTarget` and `immuneToTarget` (opponent's Spell / Trap source) for every OTHER face-up monster of its controller.
- 滅びの爆裂疾風弾 (Normal Spell): needs a face-up 青眼の白龍; destroys all opposing monsters; the used Spell registers as a lingering source (`API.lingerS03`, turn stamp `u378BanTurn`) whose `continuous.cannotAttack` (from:['linger']) stops every 青眼の白龍 of its controller that turn, also one summoned afterwards.

## Tests
- `tools/test_s03_u378_targetlocks.js` 16 / 0. Negative control on the previous build: 8 FAIL. Coverage TESTED 3268 → 3271, NOT_STARTED 596 → 593; `registration_names_missing_from_db` empty; audit 0 FAIL.
