# S03-U375 — four NOT_STARTED cards

Base: `claude/work` `90f394f` (U374, gate 20283 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZK_claude_s03_u375_traps2.js`)
- ハーピィ・レディ・SB: the carddata row already carries the alias of ハーピィ・レディ; only the text-only script is registered. Test: バード・フェイス's Deck search offers it (canonical identity), not ハーピィ・ガール.
- 異次元への隙間 (Normal Trap): `API.declare` the Attribute at activation, a registered choice handler (`u375.gap-target`) then opens a 2-card choice over both Graveyards (`p11cOpen`; `declaredValueV11` reads the declaration); resolution banishes the chosen monsters still in a Graveyard (ネクロバレー respected). Not activatable without an Attribute that has 2 Graveyard monsters.
- バーサーキング (Continuous Trap): the card activation does nothing (ruling 10/09/23, engine S03-U10 `cardActivationOnlyV32` with `fieldIgnition`); the effect is a separate QUICK effect of the face-up card — my Main Phase or the opponent's Battle Phase, once per turn, two face-up Beast monsters: the first loses half its ATK, the second gains that amount (stat modifiers until the End Phase).
- 能力吸収石 (Continuous Trap): `onActivateSuccess` (kind monster) places 魔石 counters (`counterMaxV22` 2, `counterCapableV22`); with 2 counters `continuous.negateEffect` hits every face-up monster and `activationLockS03` forbids new monster effect activations from the field; an End Phase trigger removes all counters.

## Notes
- Ruled out this round (no precedent for the needed engine call): 閃光弾 (force the End Phase mid-battle), 転生断絶, 世紀の大泥棒 (declare a card name + hand inspection).

## Tests
- `tools/test_s03_u375_traps2.js` 27 / 0. Negative control on the previous build: 13 FAIL. Coverage TESTED 3255 → 3259, NOT_STARTED 609 → 605; `registration_names_missing_from_db` empty; audit 0 FAIL.
