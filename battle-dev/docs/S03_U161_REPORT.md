# S03-U161 — イレカエル / エレキーウィ / 万力魔神バイサー・デス (conditional battle protections, full texts)

## Why
Three more monsters whose battle protection was read as unconditional from the text until S03-U158. Each had no script, or was ENGINE_GAP.
- **エレキーウィ** was ENGINE_GAP: "needs Watt metadata and a battle protection only while attacking". The P4 group WATT already exists; the attacking side was not known to the protection check.
- **イレカエル**: 「ガエル」と名のついた had no predicate. The EDOPro Frog setcode (0x1029) is a superset: it also contains イレカエル, サシカエル, 粋カエル and the spell フロッグ・バリア, none of which contain 「ガエル」 in their names.

## Engine
- **P4 overlay group GAERU**:
  - generated from the name rule 「ガエル」 at build time, runtime is passcode only;
  - 10 cards: ガエル・サンデス, デスガエル, 引きガエル, 悪魔ガエル, 未知ガエル, 裏ガエル, 貫ガエル, 鬼ガエル, 魔知ガエル, 黄泉ガエル;
  - authority version P4-v5 → **P4-v6**. `test_p4_setcode_authority.js`: predicates 34 → 35, authority 474 → 484, overlay 338, total 489 — the pinned counts follow the new authority, and the comment records why.
- **Battle protection context**: the battle-destruction check (`engine/00` killAtk / killDef) passes `battleRole` ('attacker' / 'defender') to the System v21 protections.
- Zone-local keys `u161ViceMarkedBy` / `u161ViceTargetUid`.
- On the field, group membership also checks the canonical identity (`groupMemberNowS03`), for cards treated as another name (粋カエル → デスガエル, once that treatment is implemented).

## Cards (`cards/HZI_claude_s03_u161_protections.js`)
- **イレカエル**:
  - ignition, with the Tribute as the cost;
  - the Deck is examined at resolution through the shared engine/1ZT choice (「特殊召喚する」: face-up, the player's choice);
  - `protectV21` for every 「ガエル」 on the field (both players) while face-up.
- **エレキーウィ**: `protectV21` for its controller's 「エレキ」 monsters only when attacking.
- **万力魔神バイサー・デス**:
  - ① is a forced trigger on its Normal Summon, with a target. At resolution both monsters get a link mark, and a scheduled destruction is set for the 3rd own Standby Phase (turn T+6). The destruction happens even if バイサー has left, but only to that same monster.
  - ② `protectV21` while the linked target is on the field.

## Test — `tools/test_s03_u161_protections.js` 19/0 (real DUEL path; processor turns and Standby Phases; Replay-audited)
- **A イレカエル**:
  - ワイト Tributed; only デスガエル offered (not 粋カエル / サシカエル) and Special Summoned;
  - 鬼ガエル survives an attack, イレカエル itself does not, then 鬼ガエル does not;
  - the opponent's 鬼ガエル is protected;
  - a face-down イレカエル protects nothing;
  - GAERU is exactly the 10 cards.
- **B エレキーウィ**: attacking エレキツツキ / エレキーウィ survive 青眼の白龍; an attacked エレキツツキ is destroyed.
- **C 万力魔神バイサー・デス**:
  - it targets ゴブリン突撃部隊;
  - it survives ギガンテス in turn 6;
  - the target survives turns 7 / 9 and is destroyed at turn 11's Standby Phase;
  - in turn 12 バイサー・デス is destroyed by battle.
- **Negative control on U160**: 10 FAIL.
- Pre-scan: every other gate test file is unchanged; `test_p4_setcode_authority.js` 102/102 after the authority update.

## Status
- NOT_STARTED → TESTED: イレカエル, 万力魔神バイサー・デス.
- ENGINE_GAP → TESTED: エレキーウィ (override removed).
- Totals: TESTED 2270, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 149, ENGINE_GAP 605, NOT_STARTED 1243.

## Found, not done
- **デュアル・サモナー**: its ENGINE_GAP reason (no Gemini mechanic) is outdated since S03-U119. Still missing: a Normal Summon granted by an effect in the opponent's End Phase.
- **マイン・モール**: needs a banish-on-leave that checks the cause (by the opponent's card effect).
- Both are recorded in FOLLOW_UP_GAPS.
