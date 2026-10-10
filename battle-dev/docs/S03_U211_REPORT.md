# S03-U211 — NOT_STARTED 4

## Engine
- `engine/40` `scriptSpecialSummonLockS03(p, db)`:
  - a face-up, non-negated monster whose script declares `specialSummonLockS03(db, p, srcCard, srcPlayer)` forbids that special summon.
  - It is part of `v46SpecialSummonRestrictionReason`, so it covers effect summons (`API.specialSummon`), summon procedures,
    Synchro / Xyz (`beginExSummonV2`, `exCombos`) and Fusion Spells.
  - `canEffectSpecialSummonS03` (engine/1ZK) also reads it, so candidate lists (死者蘇生 and the others) skip a locked monster.
- `engine/1G` / `engine/00`:
  - a characteristic mod added with `faceUpOnlyS03:true` (「フィールド上に表側表示で存在する限り」) ends when the monster is turned face-down (`FX_SET_STATE`);
  - leaving the field already cleared all mods (`ZONE_LOCAL_KEYS`).

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZS_claude_s03_u211_ns4.js
- A・O・J D.D.チェッカー: neither player can special summon a LIGHT monster while it is face-up.
- 魔轟神ミーズトージ: a hand ignition that sends itself to the GY as the cost; a targeted non-Tuner 「魔轟神」 is treated as a Tuner while face-up.
- ドラゴンに乗るワイバーン: can attack directly when the opponent's face-up monsters are all EARTH / WATER / FIRE. It needs at least one face-up monster.
- マジカルフィシアリスト:
  - its Normal Summon places 1 Spell Counter (max 1);
  - removing it (cost) gives a monster +500 ATK until the End Phase.
- E・HERO クノスペ:
  - each time it inflicts battle damage to the opponent: ATK +100 / DEF -100;
  - while another face-up 「E・HERO」 is on its side, it can attack directly and cannot be chosen as an attack target.
- 超古代恐獣:
  - a Tribute Summon method with 1 Dinosaur;
  - a Dinosaur special summoned from its controller's GY → draw 1.

## Tests
`tools/test_s03_u211_ns4.js` passes 30/0, on real DUEL paths and Replay-audited. The Synchro Summon uses the new Tuner. Negative cases:
- a face-down D.D.チェッカー locks nothing;
- a Tuner turned face-down and back is no longer a Tuner;
- a LIGHT monster, or only face-down monsters → no direct attack for the Wyvern;
- クノスペ alone;
- a non-Dinosaur tribute or revival.

Negative control on U210: 17 FAIL.

## Follow-up (found by the pre-scan before publication)
`tools/test_auto_cycle21.js` asserted that A・O・J D.D.チェッカー has no script, because "the engine has no consumer". That described the old build,
not the card text. This unit adds the consumer (`specialSummonLockS03`), so the assertion now checks that the script and its consumer exist.
The count is unchanged at 74. The U208 follow-up fix (resolving link restored on load) is included.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15454 PASS / 0 FAIL** (= U210 15424 + 30 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U210.
- Coverage: TESTED 2535, ENGINE_GAP 599, NOT_STARTED 1184, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 31 (4996); audit 495 declared, 0 off-target.
