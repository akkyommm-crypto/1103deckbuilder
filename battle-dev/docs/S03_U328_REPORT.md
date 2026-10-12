# S03-U328 — 「巨大戦艦」 ×5: ビッグ・コア, カバード・コア, クリスタル・コア, テトラン, ビッグ・コアMk－II

Base: `claude/work` `d1b44fc` (U327, gate 18974 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZP_claude_s03_u328_battleship.js`; counter = the plain 「カウンター」, `API.addCounter` / `removeCounter`)
- Common: forced counters on Normal Summon success (3 / 2 / 3 / 3; Mk－II: 3 on Special Summon success); battle-indestructible (`protectV21` battle); at the end of the Damage Step (`dsTiming:'end'`) of a battle with a monster the card loses one counter, or — with none — is destroyed. A direct attack is not such a battle.
- カバード・コア: the controller calls Heads / Tails (registry choice `u328.coin-call`), the replay-safe `duelRandomInt` decides; only a wrong call removes the counter.
- クリスタル・コア: once per turn, a face-up Attack Position opponent monster → Defense Position (chosen at resolution).
- テトラン: cost remove a counter; destroy a chosen Spell/Trap on the field; once per turn.
- Mk－II: a Tribute-free Normal Summon method while my field has no monster (`normalSummonProcedure` with `tributes:0`); as the text reads a Normal Summoned Mk－II has no counters.

## Tests
- `tools/test_s03_u328_battleship.js` 32 / 0 (summons with real Tributes, battles with / without counters, direct attack, both coin outcomes through seed search, クリスタル / テトラン effects and negatives, Mk－II methods and the 死者蘇生 revive; Replay audits). Negative control on the previous build: 19 FAIL. Coverage TESTED 3024 → 3029, NOT_STARTED 823 → 818; audit 0 off-target.
