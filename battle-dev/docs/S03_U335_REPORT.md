# S03-U335 — 「D－HERO」×5

Base: `claude/work` `0e33fca` (U334, gate 19149 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZW_claude_s03_u335_dhero.js`)
- ダイハードガイ: optional trigger on `onFieldToGraveBatchS03` (battle batch) — a *different* 「D－HERO」 of mine sent from the field by battle → `API.schedule` (`standbyPhase`, `turns` 2 on my turn / 1 on the opponent's turn so that it is my next Standby Phase, handler `u335.diehard-revive` checks the card is still in the Graveyard from the same turn) → Special Summoned face-up Attack. Once per turn through a card flag.
- ダガーガイ: hand Quick Effect (discard = cost) only while the opponent is the turn player in the Battle Phase; every face-up 「D－HERO」 +800 until the end of the turn (`modAtk … 'endTurn'`).
- ダッシュガイ: ignition, release (send to the Graveyard) one of my monsters as the cost → ATK +1000 until the End Phase (`countLimit`); forced `onBattlePhaseEnd` → Defense Position when it attacked this turn (`attackCountV48`); Graveyard trigger on the normal draw (`onDrawCard`, `normalDraw`, the S03-U321 drain) → show the drawn monster and Special Summon it, once per stay in the Graveyard (zone-local flag).
- ドゥームガイ: forced Graveyard trigger on the battle destruction (`graveInfo.battle`, same turn) → schedule at my next Standby Phase → choice among my Graveyard 「D－HERO」 other than ドゥームガイ → Special Summon.
- ドグマガイ: `cannotNormalSummon`; hand procedure (three monsters of mine released, at least one 「D－HERO」); forced `onSpecialSummon` trigger only for `specialSummonKind==='procedure'` → schedule at the opponent's next Standby Phase → their LP halved (rounded down).
- Left: Bloo－D, ドレッドガイ (needs 幽獄の時計塔), ディパーテッドガイ / ディスクガイ (recorded gaps), ダイヤモンドガイ (activating the Spell from the Graveyard).

## Status
- The ENGINE_GAP override of ダガーガイ (hand quick-effect window / discard provenance / turn-duration team ATK modifier) was stale: all three exist (attack declaration POINT window, `API.discard` cost, `modAtk … 'endTurn'`). Removed from `data/script_status_overrides.json`; the baseline-ENGINE_GAP → TESTED change is declared. Known limit: it is offered in the windows the engine opens in the opponent's Battle Phase (the attack declaration), the practical window of the card; there is no free-priority window in a Battle Phase without an attack.
- `tools/test_v840_batch35.js`: 「D－HERO ダガーガイ」 removed from its list of cards pinned as gaps (same kind of adaptation as U332 / U333).

## Tests
- `tools/test_s03_u335_dhero.js` 50 / 0 (both turns' battle kills for ダイハードガイ and the once-per-turn limit, the attack-declaration window and its negatives for ダガーガイ, release / Defense Position / Graveyard draw summon and negatives for ダッシュガイ, ドゥームガイ' schedule and the choice, ドグマガイ' procedure legality, the halving and a Special Summon by another effect; Replay audits). Negative control on the previous build: 18 FAIL. Coverage TESTED 3061 → 3066, NOT_STARTED 788 → 784, ENGINE_GAP 470 → 469; audit 0 off-target.
- Authoring notes: the coverage scan needs the literal full card names in the test file; a Draw Phase test must call `phase('standby');phase('main1')` before `endTurn()` (the turn after a bare DRAW action did not advance as expected).
