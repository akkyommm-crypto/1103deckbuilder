# S03-U324 — 「音響戦士」: ドラムス, ピアーノ, ベーシス

Base: `claude/work` `a51266d` (U323, gate 18885 PASS / 0 FAIL). Sonnet 5.5, single writer. All three NOT_STARTED; no engine change (they are the only 「音響戦士」 monsters of the 2011 pool).

## Cards (`cards/HZZZZZZL_claude_s03_u324_symphonic.js`)
- ドラムス / ピアーノ: ignition (Main Phase): declare an Attribute / a Type, then choose a face-up 「音響戦士」 on either field → `API.setAttribute` / `API.setRace` (permanent characteristic modifier, gone when the monster leaves the field); once per turn. Graveyard effect: banish this card (cost), the same for one of my own 「音響戦士」.
- ベーシス: ① once per turn, a face-up 「音響戦士」 of either side gets +Level = my hand size until the end of the turn (`API.modLevel`); ② banish from the Graveyard, my own 「音響戦士」 only.
- The declaration is made at resolution, then the monster is chosen (the pattern of A・ジェネクス・チェンジャー, cards/9C; choice handlers `u324.declare-pick` / `u324.apply`).

## Tests
- `tools/test_s03_u324_symphonic.js` 23 / 0 (declared Attribute / Type, not-a-candidate fixtures, once per turn, Graveyard effects and their negatives, Level rise and its end; Replay audits). Negative control on the previous build: 16 FAIL. Coverage TESTED 3009 → 3012, NOT_STARTED 838 → 835; audit 0 off-target.
