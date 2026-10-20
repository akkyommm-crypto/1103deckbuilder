# S03-U376 — four NOT_STARTED cards

Base: `claude/work` `768dc0f` (U375, gate 20310 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZL_claude_s03_u376_chainers.js`)
- 獣人アレス: forced trigger on `onActivateSuccess` with `chainLink` 1 (a chain begins); +500 ATK as a permanent stat modifier (until it leaves / is turned face-down). Its own carrier trigger (a monster effect) is excluded by name, otherwise it would count itself without end; each chain link is handled once per card (zone-local flag `chainId:chainLink`).
- 連爆魔人: `onActivateSuccess` with `chainLink` >= 2 and kind Spell / Trap -> 500 damage to the opponent of its controller (same once-per-link guard).
- 紅蓮の炎壁 (Quick-Play): cost = free multi-pick (`v46PickAnyAtLeastOne`) of 「ラヴァル」 monsters (`u325Laval`) in the Graveyard, at most the free Monster Zones; the count is kept in a player flag; `ラヴァルトークン` (炎族・炎・星1・0/0) by `API.createToken` in Defense Position.
- 地獄の暴走召喚 (Quick-Play): reads the Special Summon event (exactly one card, mine, face-up Attack, ATK <= 1500, the opponent has a face-up monster); my same-name monsters of hand / Deck / Graveyard are Special Summoned in Attack Position while there is room; the opponent then chooses one of their face-up monsters in a choice of their own (`u376.reckless-foe`) and Special Summons its same-name monsters.

## Tests
- `tools/test_s03_u376_chainers.js` 20 / 0. Negative control on the previous build: 10 FAIL. Coverage TESTED 3259 → 3263, NOT_STARTED 605 → 601; `registration_names_missing_from_db` empty; audit 0 FAIL.
