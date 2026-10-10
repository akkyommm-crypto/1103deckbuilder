# S03-U240 — 「宝玉獣」: placement as a Continuous Spell (ENGINE_GAP 2, NOT_STARTED 7)

## Workflow
- opus-only: an engine primitive that had blocked the family; 宝玉獣 アメジスト・キャット's ENGINE_GAP reason named it.
- Written in its own tree while the Sonnet subagent worked on U239, then rebased onto U239.
- `engine/1ZZG` has CRLF line endings, so it was re-applied byte-exactly to keep them uniform.

## Engine (engine/1ZZH_crystal_beast_s03.js, new; engine/1ZV, 1ZZG, 00)
**1. Destroyed in the Monster Zone → placed instead.**
The text: 「このカードがモンスターカードゾーン上で破壊された場合、墓地へ送らずに永続魔法カード扱いとして自分の魔法&罠カードゾーンに表側表示で置く事ができる」.
- A script declares `crystalPlaceS03`, or `{faceUpOnly:true}` for the texts that say 「表側表示のこのカードが」.
- The choice uses the S03-U173 decision flow (the user's decision: optional choices at a destruction pause and ask). It is a new kind, `placeSpell`, asked of the card's controller and not cancelable:
  - 「墓地へ送らずに、永続魔法カード扱いとして魔法＆罠ゾーンに置く」;
  - 「置かずに墓地へ送る」.
- Unlike a substitute, the card **is destroyed**: the destruction events and counts stay. Only its destination changes.
- The journaled `DESTROY_SUB_S03` reducer marks the card `crystalPlaceS03 {turn}`.
- The GY move (`pushZone` → `graveRedirectPileS03`, engine/1ZZG) then puts it face-up in its owner's Spell & Trap Zone with `card.asSpellS03 {turn}`.
- The option is not offered when that zone is full. This counts the Spell that is still resolving: with 4 Set cards plus ブラック・ホール itself, the card goes to the GY.
- `onSendToGrave` for the placed card is suppressed, as for the U214 banish redirect.
- Reach: the same as U173, i.e. effect destructions during a chain link resolution (`API.destroy` / `destroyAll`) and battle.

**2. 「…を永続魔法カード扱いとして自分の魔法&罠ゾーンに表側表示で置く」 by an effect.**
- `placeAsSpellS03(p, from, index, reason)` → the journaled `FX_PLACE_SPELL_S03`, from hand, Deck or GY.

**3. Zone-local state.**
- `asSpellS03` is zone-local, and `FX_SPECIAL_SUMMON` from the Spell & Trap Zone clears it. The existing 宝玉の契約 summons a placed card correctly.

「宝玉獣」 monsters are identified by name (「…と名のついた」).
- The project setcode CRYSTAL_BEAST (0x1021) also covers 究極宝玉神 and the 「宝玉の…」 Spells / Traps, and the overlay has no 宝玉獣 group.
- The S03-U242 tests found that the setcode let ペガサス / コバルト / ルビー pick a 究極宝玉神. That was fixed here, before this unit's gate.

Limit (documented): a placed card keeps `dbOf(card).k==='m'`.
- Zone-based effects see it: 大嵐, 宝玉の導き, 宝玉の契約, コバルト・イーグル.
- Scripts that select Spell / Trap cards by `db.k` do not.

## Cards → TESTED (2011 texts) — cards/HZZZT_claude_s03_u240_crystal_beast.js
All seven 宝玉獣 declare the placement.

| Card | Was | Effect |
|---|---|---|
| 宝玉獣 アメジスト・キャット | ENGINE_GAP (override removed) | direct attack; its direct battle damage is halved |
| 宝玉獣 アンバー・マンモス | NOT_STARTED | the opponent targets another own 宝玉獣 → may move the attack to itself |
| 宝玉獣 エメラルド・タートル | NOT_STARTED | once per turn, a monster that attacked this turn → Defense Position |
| 宝玉獣 コバルト・イーグル | NOT_STARTED | once per turn, an own 宝玉獣 card → top of its owner's Deck |
| 宝玉獣 サファイア・ペガサス | NOT_STARTED | Normal / Flip / Special Summon → place a 宝玉獣 from hand / Deck / GY |
| 宝玉獣 トパーズ・タイガー | NOT_STARTED | +400 ATK during the damage step when it attacks a monster |
| 宝玉獣 ルビー・カーバンクル | NOT_STARTED | Special Summon → special summon the 宝玉獣 in its Spell & Trap Zone, as many as fit |
| 宝玉の恵み | ENGINE_GAP (override removed) | up to 2 宝玉獣 from the GY placed |
| 宝玉の解放 | NOT_STARTED | equip +800; sent from the field to the GY → place a 宝玉獣 from the Deck |

## Existing test adjusted (status record; no behavior assertion changed)
- `tools/test_v780_batch30.js` listed 宝玉の恵み among the precise ENGINE_GAP overrides.
- It moves to a 「Crystal Beast placement unlocked」 check, which asserts that the override is gone. This follows the S03-U214 / U238 precedent.
- The PASS count (45) is unchanged.

## Tests
`tools/test_s03_u240_crystal_beast.js` passes 31/0, on real DUEL paths and Replay-audited.
- Placement after an effect destruction and after a battle destruction.
- Decline, and the full-zone case.
- アメジスト's halved direct damage.
- アンバー's redirect.
- エメラルド's position change.
- コバルト back to the Deck.
- ペガサス placing from the Deck.
- トパーズ's damage-step +400, and back to 1600 afterwards.
- ルビー summoning both placed cards.
- 恵み from the GY.
- 解放's +800 and its placement on leaving the field.
- 宝玉の契約 summoning a placed card.

Other checks:
- The U173–U179 tests, `test_s03_u183`, `u201` (宝玉の導き), `u214`, `u233`, `u238`, `test_v780_batch30`, `test_v910_batch42`, `test_v920_batch43`, `test_s03_u135`, `test_equip_cards` and `test_battle_cards` still pass.
- Negative control on U239: 18 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16063 PASS / 0 FAIL** (= U239 16032 + 31 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U239.
- Coverage: TESTED 2707, ENGINE_GAP 595, NOT_STARTED 1018, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 667 declared, 0 off-target.
