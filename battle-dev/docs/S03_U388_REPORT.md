# S03-U388 — Tribute-restricted tokens and two Dragunity monsters

Base: `claude/work` `71486f7` (U387, gate 20555 PASS / 0 FAIL). Sonnet 5.5, single writer. Small engine addition (a token flag).

## Engine
- Token flag `advanceTributeOnlyForS03` (a name fragment): the token can be Tributed only for the Advance Summon of a monster whose name contains it — `engine/00_state_actions.js` (TOKEN_CREATE copies it), `engine/40_legal_script_engine.js` (`createToken` passes it), `engine/70_summon_procedures.js` (`tributeCandidates` filters it). It generalises `noAdvanceTributeNonDarkS03` (S03-U188).

## Cards (`cards/HZZZZZZZZX_claude_s03_u388_tokens_dragunity.js`)
- 雲魔物－羊雲 / ジュラック・スタウリコ: forced Graveyard trigger after a battle destruction (`graveInfo.battle`); two tokens (`雲魔物トークン` 天使族・水 / `ジュラックトークン` 恐竜族・炎, 星1, 0/0) in Defense Position — only when two Monster Zones are free.
- ドラグニティ－ピルム: optional Normal Summon trigger; a 「ドラグニティ」 Winged Beast of the hand is Special Summoned, then `API.equipMonster` equips the Pilum; `continuous` (from the Spell & Trap Zone) `grantsDirectAttack` for the equipped monster and a `battleDamage` halving of its direct attacks.
- ドラグニティアームズ－ミスティル: `summonProcedure` from the hand (a face-up 「ドラグニティ」 sent to the Graveyard as the cost); after a Normal / Special Summon from the hand an optional `API.equipFromGrave` of a Dragon 「ドラグニティ」 (helpers `as01Pool` / `as01EquipOperation` of the S03 astra system 01).
- Not done: ドラグニティ－プリムス・ピルス (equip from the Deck: only `equipFromGrave` exists), ドラグニティナイト－トライデント (Extra Deck inspection).

## Tests
- `tools/test_s03_u388_tokens_dragunity.js` 16 / 0. Negative control on the previous build: 10 FAIL. 17 token / Tribute / Dragunity regression tests: 0 failures. Coverage TESTED 3307 → 3311, NOT_STARTED 557 → 553; `registration_names_missing_from_db` empty; audit 0 FAIL.
