# S03-U365 — 天魔神 ノーレラス / エンライズ and 怨念の魂 業火

Base: `claude/work` `ddb7574` (U364, gate 20074 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZA_claude_s03_u365_tenma.js`)
- ノーレラス / エンライズ: hand `summonProcedure`s that banish 1 LIGHT Angel + 3 DARK Fiends / 3 LIGHT Angels + 1 DARK Fiend from the Graveyard (the S03-U343 helpers `u342Bad` = ネクロバレー check and `u342PickN`). ノーレラス: `payCost` 1000, then every hand card (`API.sendHandToGrave`) and every field card (`API.sendToGrave`) of both players goes to the Graveyard, then `API.draw`. エンライズ: once-per-turn ignition (meta `countLimit:1`), target a face-up monster, `API.banish`, and the card flag `cannotAttackTurn`.
- 怨念の魂 業火: hand `summonProcedure` (a FIRE monster on my field); a forced self trigger on its procedure summon (`specialSummonKind==='procedure'`) destroys a FIRE monster of mine (chosen); ignition: release another FIRE monster (cost) -> `v4RegisterStatModifier({atk:500})` until the End Phase; a forced Standby trigger creates a 火の玉トークン (`defineTokenSpecV11` + `API.createTokens`, Defense Position).
- Not part of this unit: 神禽王アレクトール / 渋い忍者 (the "only one face-up on the field" rule), 幻銃士 (a "up to N" count choice), 召喚僧サモンプリースト (cannot be released).

## Tests
- `tools/test_s03_u365_tenma.js` 26 / 0. Negative control on the previous build: 16 FAIL. Coverage TESTED 3216 → 3219, NOT_STARTED 634 → 631; `registration_names_missing_from_db` empty; audit 0 FAIL.
