# S03-U142 — 未来融合－フューチャー・フュージョン: position choice for the delayed Fusion Summon

## Why
Recorded in U133: 超融合 and ミラクル・フュージョン were given a position choice, but 未来融合 still always Fusion Summoned in
Attack Position. Its summon runs inside a scheduled Standby Phase handler, and a choice there had not been proven safe.
U136 has since shown that a choice opened from a scheduled phase handler works through the real processor (W星雲隕石's End
Phase summon); 磨破羅魏 already does this in the Draw Phase.

## Change
- `cards/HF_claude_s03_u59_future_fusion.js`:
  - The schedule handler `s03u59.future-fusion-summon` now opens an ATK / DEF choice instead of summoning directly.
  - The new handler `s03u142.future-fusion-pos` checks again that 未来融合 is still on the field and that the chosen Fusion
    Monster is still in its owner's Extra Deck. It then Special Summons it (`summonKind:'fusion'`) in the chosen position
    and links it to 未来融合 as before.
- `tools/test_s03_u59_future_fusion.js`: the driver answers the new position question (ATK, as before); the assertions are
  unchanged.

## Test — `tools/test_s03_u142_future_fusion_position.js` 6/0 (real DUEL path through the processor, Replay-audited)
- Built from the U59 setup: 未来融合 sends 5 Dragons, then play advances four Standby Phases.
- DEF: F・G・D is Fusion Summoned face-up in Defense Position. Destroying 未来融合 then also destroys F・G・D (still linked).
- ATK: the same with Attack Position.
- Negative control on U141: the DEF case fails (ATK only).
- Pre-scan of all 361 gate tests (parallel): 0 FAIL.

## Status
- No status change (未来融合 is TESTED; focus added).
