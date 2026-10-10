# S03-U284 — 4 cards (地縛神 Aslla piscu, 地縛神 Ccarayhua, 地縛神 Uru, 地縛神 Wiraqocha Rasca); 地縛神 Chacu Challhua and 地縛神 Cusillu parked

## Workflow (mixed, Sonnet 5.5 battle-implementer, workflow v3)
- Sonnet owned the unit end to end in this tree: card file, test, negative control, declarations, audit, pre-scan, full gate, report, measurement draft.
- No engine change. Every script passes through `earthboundCommonS03` (engine/1ZZM, S03-U282).

## Cards -> TESTED (2011 texts) — cards/HZZZZZK_claude_s03_u284_earthbound2.js
- **地縛神 Aslla piscu:** forced `onLeaveField` trigger (range ALL, from the hand / GY / banish / Deck too).
  - Fires when it leaves the field face-up by any way but its own no-Field-Spell destruction (effect, battle, bounce, banish).
  - The own rule destruction leaves no move provenance, is not battle, and no face-up Field Spell exists then.
  - It destroys every face-up opponent monster of the controller it left, then inflicts 800 x the number destroyed.
- **地縛神 Ccarayhua:** forced `onDestroy` trigger from the GY.
  - Destroyed by an effect (graveInfo.byDestroy, moveProvenance 'effect', source not itself).
  - Battle destruction, its no-Field-Spell rule and the uniqueness rule do not count.
  - It destroys every card on both fields (Monster, Spell & Trap and Field Zones, face-down too).
- **地縛神 Uru:** ignition, once per turn, own Main Phase.
  - Cost: release another monster you control; target (chosen at activation): 1 face-up opponent monster.
  - Control is taken until the End Phase (`API.changeControl`, `until:'endPhase'`).
- **地縛神 Wiraqocha Rasca:** forced Normal / Tribute Summon trigger with the P1.1 multi-target activation (`activationV11` + `p11cOpen`).
  - Targets (Opus ruling: at least 1): 1 to min(3, opponent hand) other cards on its controller's field.
  - Each target is returned to its owner's Deck (shuffled); the opponent then discards that many cards at random (journaled RNG).
  - Its ATK rises by 1000 per discarded card (permanent mod, until it leaves the field).

## Parked (no script)
- **地縛神 Chacu Challhua:** "while it is face-up in Defense Position, the opponent cannot conduct their Battle Phase" needs a continuous hook that `battlePhaseForbiddenV340` (engine/30) consults; only `temporaryFlags.noBattlePhase` exists. The ignition half (half DEF damage, no attack that turn) is a copy of フェアリー・アーチャー (`attackCountV48` + `cannotAttackTurn`).
- **地縛神 Cusillu:** the battle-destruction substitute is a release of another monster (a new `destroySubstituteS03` kind in engine/1ZV) and halves the opponent's LP; both are missing.

## Tests
`tools/test_s03_u284_earthbound2.js` passes 49/0 on real DUEL paths and Replay-audited.
- Aslla piscu: effect, battle and bounce destruction; negatives for its own destruction, face-down and no face-up opponent monster.
- Ccarayhua: destroyed by an effect; negatives for battle and its own destruction.
- Uru: control taken and returned; negatives for alone, face-down target, opponent turn and Battle Phase.
- Wiraqocha Rasca: 1 / 2 / 3 targets; negatives for an empty opponent hand, no other card and Special Summon.

Negative control on U283: 19 FAIL (the 30 negative checks pass on the old build, as they should).

## Opus review
- 地縛神 Aslla piscu, Ccarayhua, Uru and Wiraqocha Rasca are accepted as TESTED, each with its basis above.
- 地縛神 Aslla piscu 「このカードの効果以外の方法」:
  - The engine now records why a card was destroyed by its own rule text: `graveInfo.selfRuleS03` is `self` or `unique`, set by engine/1ZZF and the `FX_TO_GRAVE` reducer.
  - The card reads that stamp instead of a heuristic.
  - A uniqueness-rule destruction is "another way".
- 地縛神 Chacu Challhua and 地縛神 Cusillu are parked as engine work:
  - a continuous Battle Phase prohibition while it is face-up in Defense;
  - a release-type destruction substitute with LP halving.
- Known engine limit, shared with existing cards such as 天刑王 ブラック・ハイランダー: a destruction count read right after `API.destroy` can miss a destruction deferred by an optional destruction substitute. Recorded as an engine item.
- Pre-scan + gate re-run by the parent after the change.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17626 PASS / 0 FAIL** (= U283 17577 + 49 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U283.
- Coverage: TESTED 2894, ENGINE_GAP 502, NOT_STARTED 923, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 856 declared, 0 off-target.
- Published in the batched checkpoint S03-U284–U287.
