# S03-U182 — E・HERO グロー・ネオス / E・HERO カオス・ネオス

## Cards (NOT_STARTED → TESTED)
- グロー・ネオス: contact fusion; Main Phase 1 once per turn: destroy a face-up opponent card (chosen at resolution; the 2011 text does
  not target) and gain by its type — monster: cannot battle this turn; Spell: may attack directly this turn; Trap: Defense Position;
  End Phase return.
- カオス・ネオス: contact fusion; Main Phase 1 once per turn: 3 coin tosses (duel RNG) — 3 heads: destroy every opponent monster;
  2 heads: the opponent's face-up effect monsters are negated this turn; 1 head: every own monster to the hand; End Phase (forced, one
  effect): return to the EX Deck and set every face-up monster (tokens cannot be set).

## Tests
`tools/test_s03_u182_glow_chaos_neos.js` 17/0 (real DUEL paths, Replay-audited; the coin outcomes come from seeds found in the test).
Negative control on U177: fails. With this unit every contact-fusion card of the 2011 pool is implemented (21).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14828 PASS / 0 FAIL** (= U181 14811 + 17 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U181.
- Coverage: TESTED 2322, ENGINE_GAP 599, NOT_STARTED 1214, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 134 (4996); audit 283 declared, 0 off-target.
