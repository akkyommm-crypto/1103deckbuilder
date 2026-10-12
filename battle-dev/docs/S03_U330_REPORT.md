# S03-U330 — 「ヴァイロン」 ステラ / プリズム / ハプト

Base: `claude/work` `4b8a28c` (U329, gate 19023 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change (uses `API.equipFromGrave` of System v31 for a monster-equip, `API.unequip`, the `banishWhenLeavesField` card flag).

## Cards (`cards/HZZZZZZR_claude_s03_u330_vylon.js`)
- ステラ / プリズム: optional trigger from the Graveyard when sent from the Monster Zone this turn (`graveInfo.from==='mz'`): cost 500 LP (`API.payCost`, not below 500), the host is chosen at resolution among my face-up monsters and the card is equipped (`equipTo.sourceUid` = itself, `v46MonsterEquip`). ステラ: forced end-of-Damage-Step trigger from the Spell & Trap Zone destroying the monster the host battled (if still on the field). プリズム: continuous +1000 ATK for the host while a Damage Step with it is open.
- ハプト: ignition once per turn: an own equipped 「ヴァイロン」 monster is unequipped and Special Summoned face-up Defense, flagged `banishWhenLeavesField`.
- Left: テトラ (an optional substitute granted by the Equip Card; only the mandatory `equipSubstituteS03` exists), スフィア (②'s cost sends the card away before its target is chosen), ポリトープ (multiple targets at activation), ヴァンガード (the equip count at the destruction), the Synchro Monsters (アルファ…オメガ, エプシロン needs 「cannot be targeted」), セグメント, マター.

## Tests
- `tools/test_s03_u330_vylon.js` 16 / 0 (equip route in real battles, LP cost, the negatives (no host / under 500 LP), ステラ' destruction, プリズム' damage figures, ハプト' summon, flag and banish; Replay audits). Negative control on the previous build: 7 FAIL. Coverage TESTED 3033 → 3036, NOT_STARTED 814 → 811; audit 0 off-target.
