# S03-U151 — ウェポンチェンジ duration; hand activations judged at their real slot; fixed seeds for the remaining duel tests

## Why
- ウェポンチェンジ (TESTED), text: 「…攻撃力と守備力を次の相手のエンドフェイズ終了時まで入れ替える。このカードが破壊された時、その効果
  は無効になる。」
  - The script called `API.swapBaseStats(…, 'endTurn')`, so the swap ended with its own turn, one turn early.
  - Nothing ended it when ウェポンチェンジ was destroyed.
  - The flag it wrote for this (`d4WeaponSwapTurn`) was read nowhere. A scan of all 146 flags set through `API.setCardFlag` found
    only two never read; the other, ブレイン・ジャッカー's `e3HostUid`, is harmless.
- Found while testing it: a Spell activated from the hand was judged at **Spell & Trap slot 0** instead of the slot it would take.
  - `strictScriptLegalityV2` built its contexts with the hand index plus `logicalZone:'sz'`.
  - The callers' `prospectiveIndex` (engine/30 `duelActivateFromHand` / quick-play branch, engine/40 zone actions) was never read.
  - A 「このカード以外」 filter keyed on (zone, index), such as サイクロン's, removed the card already in the first slot. So a player
    whose only Spell/Trap was in slot 0 could not activate サイクロン from the hand to destroy it.
- U150's first gate run failed on a time-seeded duel test. Seven more duel tests started from `resetForTestDuel()` with the
  `Date.now()` seed.

## Change
- `cards/C7_auto_cycle25.js` ウェポンチェンジ: the swap is now this card's continuous effect on the chosen monster.
  - The resolution marks the monster with `d4WeaponSrcUid` (this card) and `d4WeaponUntilTurn` (the next turn). Both are
    zone-local (engine/00 `ZONE_LOCAL_KEYS`).
  - While ウェポンチェンジ is face-up in the Spell & Trap Zone and the turn is not past `d4WeaponUntilTurn`, the monster's original
    ATK / DEF are swapped (`setBaseAtk` / `setBaseDef`).
  - So the swap lasts through the opponent's End Phase and stops at once when this card is destroyed or leaves.
- `engine/30_processor_chain_battle.js` `strictScriptLegalityV2`: when `logicalZone` differs from the real zone and a
  `prospectiveIndex` is given, the contexts use that index (`logicalIndexS03`).
- Fixed RNG seed `0x5331a5e5` + journal reset right after `resetForTestDuel()` in test_s03_vs1, vs2, vs3, vs4, vs6, u38 (2 places)
  and u06. Their assertions are unchanged; each keeps its PASS count over 3 runs.

## Test — `tools/test_s03_u151_weapon_change.js` 7/0 (real DUEL path: activation, phases, turns; Replay-audited)
- A:
  - activated in its own Standby Phase: 700 paid, ゴブリン突撃部隊 2300/0 → 0/2300;
  - still swapped in the opponent's turn 6;
  - back to 2300/0 in turn 7.
- B:
  - swapped, then サイクロン activated **from the hand** destroys ウェポンチェンジ, which sits in slot 0;
  - the swap ends at once.
- Negative control on U150 (`dist/battle.html` + this test): 2 FAIL, 0 errors:
  - the swap had already ended in turn 6;
  - サイクロン could not target ウェポンチェンジ ("フィールドに魔法・罠がありません").
- `tools/test_auto_cycle25.js` (its direct ウェポンチェンジ checks) keeps 99/99.

## Not in this unit (recorded)
- If ウェポンチェンジ leaves the field other than by destruction (e.g. returned to the hand), the swap also stops. The text only
  names destruction; the 2011 ruling for other ways of leaving was not verified.

## Status
- No status change. ウェポンチェンジ stays TESTED, now matching its text.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14317 PASS lines (= U150 14310 + 7 new, exactly), 0 FAIL, no Traceback / ReferenceError
  (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- Pre-scan of all 370 gate tests (parallel): every exit code 0, 0 FAIL; per-file PASS / Error counts equal to U150 except the new test
  (the seeded duel tests keep their counts).
- `dist/battle.html` SHA256 `7273b2762a854ad21908c56fa0a7134a69764697aed9869ac3e63a4ebbea71c8` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `265a6f7b70c0b6b4301d3f791f8c9a76a4d3e27dc410df76480a86c2cd84fb6e`.
- Coverage unchanged: TESTED 2230, IMPLEMENTED 94, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1247 (4996); 197 declared
  status changes, 0 off-target.
