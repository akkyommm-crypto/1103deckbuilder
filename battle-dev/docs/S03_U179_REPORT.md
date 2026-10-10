# S03-U179 — E・HERO ストーム・ネオス / E・HERO マグマ・ネオス

## Mechanism
「この効果によってこのカードがエクストラデッキに戻った時、…」 is a separate forced trigger of the card in the EX Deck (2011 rulings;
ocgcore uses a separate EVENT_TO_DECK trigger). The shared End Phase return (`endPhaseReturnExEffectS03`) now issues its FX_RETURN_DECK
with `epReturnS03:true`; the reducer marks the returned card (`epReturnedS03 = turn`); `epReturnedTriggerS03(ctx)` accepts the
onLeaveField event (which scans the EX Deck) only for that card, from the Monster Zone, this turn. A return by another effect does not
trigger it.

## Cards (NOT_STARTED → TESTED)
- ストーム・ネオス: contact fusion; ① 1/turn, main phase: destroy every Spell / Trap on the field; End Phase return; then every field
  card to its owner's Deck (shuffled).
- マグマ・ネオス: contact fusion; ATK +400 per card on the field; End Phase return; then every field card to its owner's hand.

## Tests
`tools/test_s03_u179_storm_magma.js` 9/0 (real DUEL paths, Replay-audited): A ストーム ① (own / opponent set cards + field spell),
1/turn, End Phase → trigger → the field empty, shuffled; B マグマ 4600 ATK, End Phase → field cards to hands; C マグマ bounced by the
opponent's グラン・ネオス → no trigger. The U174 / U176 / U177 / U178 / cycle66 tests are unchanged. Negative control on U175: fails.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14769 PASS / 0 FAIL** (= U178 14760 + 9 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U178.
- Coverage: TESTED 2305, ENGINE_GAP 601, NOT_STARTED 1221, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 142 (4996); audit 266 declared, 0 off-target.
