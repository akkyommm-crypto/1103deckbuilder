# S03-U331 — 「ゼンマイ」 ×5: ウォリアー, ナイト, ハンター, バット, マジシャン

Base: `claude/work` `d6c1125` (U330, gate 19039 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change (the Continuous Spell ゼンマイマニュファクチャ is not part of the unit).

## Cards (`cards/HZZZZZZS_claude_s03_u331_zenmai.js`; 「once while face-up」 = the zone-local card flag `u331Used`, set at activation)
- ウォリアー: ignition, a face-up 「ゼンマイ」 of mine (itself allowed) gets Level +1 / ATK +600 until the End Phase (`API.modLevel` / `modAtk` 'endTurn').
- ナイト: optional `onAttackDeclare` trigger (speed 2) when the target is my face-up 「ゼンマイ」: `API.negateAttack`.
- ハンター: ignition (Main Phase), cost release another 「ゼンマイ」 (not another ハンター); a random card of the opponent's hand (`duelRandomInt`) to the Graveyard.
- バット: ignition (Main Phase, Attack Position): to face-up Defense Position, a chosen Graveyard 「ゼンマイ」 to the hand.
- マジシャン: optional trigger after `onActivateSuccess` of another 「ゼンマイ」 monster's effect: Special Summon a Lv4- 「ゼンマイ」 from the Deck in face-up Defense.

## Tests
- `tools/test_s03_u331_zenmai.js` 22 / 0 (each effect, the once-per-presence limit, the restore at turn's end, the negatives (non-ゼンマイ target / release candidates / Defense Position / empty Graveyard / a Spell activation); Replay audits). Negative control on the previous build: 10 FAIL. Coverage TESTED 3036 → 3041, NOT_STARTED 811 → 806; audit 0 off-target.
