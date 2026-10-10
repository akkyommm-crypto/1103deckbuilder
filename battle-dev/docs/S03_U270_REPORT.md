# S03-U270 — 5 cards (ショット・ガン・シャッフル, デス・ウォンバット, ホーリーライフバリアー, 雷電娘々, 氷結界の武士); ワタポン parked

## Workflow (v3, delegation-expanded-v3-batch3)
- A Sonnet 5.5 `battle-implementer` owned the unit end to end in this tree: cards, test, negative control, declarations, status-record tests, audit, pre-scan and the full gate.
- No engine change. The parent (Opus) reviews and publishes.

## Cards → TESTED (2011 texts) — cards/HZZZZX_claude_s03_u270_gap2.js
- **ショット・ガン・シャッフル** (Continuous Spell): `fieldIgnition`, own Main Phase, once per turn.
  - The 300 LP are the activation cost; placing it from the hand pays nothing.
  - Whose Deck is shuffled (own / opponent's) is a non-targeting option choice made at resolution.
- **デス・ウォンバット:** `continuous.lpChange`: effect damage (cause `effect`) to the current controller becomes 0 while it is face-up; battle damage and the other player are untouched.
- **ホーリーライフバリアー** (Trap): discard 1 chosen at activation (`p11cards.cost-commit`); resolution adds an `API.addLpRule` (cause `all`, prevent) valid through the turn.
- **雷電娘々:** `selfDestroyWhenS03`: destroyed while its controller controls a face-up monster whose current Attribute is not LIGHT.
- **氷結界の武士:** forced `onPositionChange` trigger (`v10SelfTurnedToDefense`): face-up Attack to face-up Defense destroys it, then its controller draws 1.

## Not done
- **ワタポン** stays ENGINE_GAP. `API.searchDeck` (`FX_SEARCH`) emits no `onAddToHand`; only `API.deckToHand` (`FX_DECK_TO_HAND`) does.
  - Most searches use `searchDeck`, so a Deck-to-hand trigger would be incomplete without an engine change (emit the event in `FX_SEARCH`).
  - Reproduction: `API.searchDeck(0,0,'x')` leaves `gameState.deferredEvents` empty; `API.deckToHand` queues `onAddToHand`.

## Rulings
- ホーリーライフバリアー uses cause `all` on its activator. "From the opponent" is not distinguished: an LP rule has no source player, so own-card effect damage to the activator is also 0 this turn. Distinguishing needs the LP action's `byPlayer` passed into `resolveLpChangeV18` (engine change; not done).
- 雷電娘々 counts itself (the text says "a face-up non-LIGHT monster", not "other"); this matters only if its own Attribute is changed.
- 氷結界の武士 draws even if the destruction fails.
- ショット・ガン・シャッフル needs LP of at least 300.

## Opus review
- Two deviations from the 2011 texts were found in review and are corrected in S03-U271, which is published in the same checkpoint (U268–U271):
  - ホーリーライフバリアー — 「相手から受ける」: the rule now carries the opponent as its origin (S03-U271 `originPlayer`).
  - 氷結界の武士 — 「破壊し、…ドローする」: it now draws only when it was destroyed.
- The `timing:['mainPhase']` check does not look at whose turn it is (found by the subagent); other `fieldIgnition` cards may share this. Recorded as a follow-up.

## Existing tests adjusted (status records; no behavior assertion changed)
Each card's "precise ENGINE_GAP" check becomes a `!ov[n]` check with the comment `S03-U270: implemented and tested; kept as a record`; every count is unchanged:
`test_v500_batch02`, `test_v570_batch09`, `test_v540_batch06`, `test_v610_batch13`, `test_v600_batch12`. `test_v590_batch11` is untouched (ワタポン remains a gap).

## Tests
`tools/test_s03_u270_gap2.js` passes 61/0, on real DUEL paths (hand / field ignition, POINT responses, chain windows, battle, Normal / flip summons, manual and effect position changes) and Replay-audited.
Negative control on U269: 27 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17159 PASS / 0 FAIL** (= U269 17098 + 61 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U269.
- Coverage: TESTED 2857, ENGINE_GAP 535, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 818 declared, 0 off-target.
- Published in the batched checkpoint S03-U268–U271.
