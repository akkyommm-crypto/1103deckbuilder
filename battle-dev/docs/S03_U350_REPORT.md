# S03-U350 — seven battle-reactive / static monsters

Base: `claude/work` `0a5866c` (U349, gate 19740 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZL_claude_s03_u350_guards.js`)
- 雷魔神－サンガ / 風魔神－ヒューガ / 水魔神－スーガ: the Damage Step "calc" window as クリボン (S03-U345): monster script with `dsTiming:'calc'`, `activateFrom:['mz']`, passive `onDamageStep`; condition = I am attacked on the opponent's turn and the effect is unused (card flag `u350Used`, zone-local so a new face-up stay starts again); the resolution sets the attacker's ATK to 0 with a stat modifier (`setAtk:0`, lasts while face-up on the field).
- 盲信するゴブリン: `controlLockS03` (engine/00, S03-U251).
- 牙城のガーディアン: hand response in the Damage Step when my Defense Position monster is attacked; cost = discard itself; the attacked monster gets a `def:+1500` modifier until the End Phase.
- 精気を吸う骨の塔: continuous `cannotBeAttackTarget` on itself while another face-up Undead is on its controller's field; forced trigger on `onSpecialSummon` (declared `onOtherSummon:true` — otherwise only its own summon reaches it) that mills the opponent's Deck top 2 per Undead summoned.
- 火車: `cannotNormalSummon` + hand `summonProcedure` (2+ face-up Undead on my field); forced self trigger on its Special Summon returns every other monster of both fields to the owners' Decks (shuffled) and records the number of face-up original-Undead ones in a card flag read by the continuous `setAtk` (n × 1000).
- Not part of this unit: 砂漠の守護者 (the substitute destroys it instead of OTHER insects; the engine's substitute kinds protect the card itself only), 瞬着ボマー / 精神寄生体 (a Set monster attacked becomes an Equip), 星見鳥ラリス (banish → returns at the next Battle Phase), 爆炎集合体 ガイヤ・ソウル (optional Fire tributes for ATK), 椿姫ティタニアル, 毒蛇王ヴェノミノン (ヴェノム・スワンプ immunity).

## Tests
- `tools/test_s03_u350_guards.js` 39 / 0. Negative control on the previous build: 19 FAIL. Coverage TESTED 3153 → 3160, NOT_STARTED 697 → 690; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Real DUEL paths: attacks into the calc window (3 Majin: ATK 0, once only, used-flag control, Defense Position, own attack), a hand response (牙城, with an Attack Position control), a control-change attempt (心変わり), 死者蘇生 as the Special Summon source for the tower (and a non-Undead control), the 火車 hand procedure (legal / illegal / Normal Summon refused / full sweep with ATK 3000). Replay audit on the main paths.
