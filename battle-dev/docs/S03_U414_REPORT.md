# S03-U414 - Inverz Cell/Scout (インヴェルズの魔細胞・斥候), Deep-Green Magic Archer (深緑の魔弓使い), Blue-Blood Vampire (蒼血鬼)

Base: `claude/work` `e00c096` (U413, gate 21007 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZX_claude_s03_u414_inverz.js`)
- インヴェルズの魔細胞: defineScript with a summonProcedure (no monsters), noAdvanceTributeS03 function form (db argument) and cannotSynchroMaterial.
- インヴェルズの斥候: Graveyard ignition (Main Phase 1 start, no Spell / Trap) + banSummonS03 special, same restrictions.
- 深緑の魔弓使い: continuous cannotBeAttackTarget while a Plant stands + ignition with a Plant sacrifice destroying a Spell / Trap.
- 蒼血鬼: Summon / Flip Summon to Defense Position + once-per-turn Xyz-material-detach (detachCostS03 with a holders function, the controller chooses) revival of a Level 4 Undead.

## Engine (one line)
- `engine/70_summon_procedures.js` tributeCandidates passes the summoned monster's db to the function form of noAdvanceTributeS03.

## Tests
- `tools/test_s03_u414_inverz.js` 22 / 0. Negative control on the previous build (card file removed): 15 FAIL. No existing test changed. Coverage TESTED 3396 -> 3400, NOT_STARTED 475 -> 471, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
