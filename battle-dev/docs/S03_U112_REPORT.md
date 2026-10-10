# S03-U112 — 暗黒界の門 + the 暗黒界 "mandatory discard effect" cluster + discard cause via P3 provenance

## Why
Priority #7 IMPLEMENTED tier, main-deck qty=2: 暗黒界の門 (fixed list `major_decks_v1_dark.txt` x2). Probing it
exposed a same-contract cluster across the dark deck's engine (ブラウ x3, ベージ x3, スノウ x3, グラファ x3,
手札抹殺 x1 are all in the fixed dark list). Base: U111 source (U111 published first; this tree is U111 + the
changes below).

## Contract
"A mandatory discard-related effect must not be skippable, and 『相手のカードの効果によって捨てられた場合』 must
come from the recorded discard cause, never from asking the player."

## Measured defects and fixes
1. **暗黒界の門**: after the cost (banish a Fiend from the GY) the discard prompt was cancelable; cancelling skipped
   the discard and the draw. → `cancelable:false`.
2. **暗黒界の雷**: same cancelable mandatory discard → `cancelable:false`; and `condition()` counted the set card
   itself as the required face-down card (legal with nothing else to target) → excludes itself.
3. **暗黒界 monsters** ブラウ / ゴルド / ベージ / スノウ / シルバ / グラファ: the first clause of each is mandatory in
   the 2011 text ("…ドローする", "…特殊召喚する", "…手札に加える", "…選択して破壊する"), but none was `forced`, so each
   was offered as an optional trigger that could be declined. → `forced:true` (forced applies to trigger candidates
   only; グラファ's GY ignition revival is unaffected). グラファ's destroy choice → non-cancelable. The optional second
   clauses ("さらに…できる") stay optional.
4. **ブラウ / ゴルド** decided "discarded by the opponent's effect?" by asking the player (a self-report: the player
   could always claim the extra draw / destruction). → decided by `darkWorldDiscard(ctx)` from `discardInfo`.
5. **Discard cause**: "discarded by the opponent's card effect" never fired for effects that discard without passing
   `byPlayer` (e.g. the opponent's 手札抹殺). A first attempt changed `FX_DISCARD`'s default `discardInfo.byPlayer`
   centrally; the Full Gate rejected it (`test_p3_provenance.js` pins that `discardInfo.byPlayer` keeps its
   hand-owner meaning and that the effect controller is the separate P3 provenance field `actingPlayer`). The engine
   change was reverted; instead `darkWorldDiscard` (the single helper all 暗黒界 cards use) also consults
   `movedByOpponentEffectV3(card, player)`. Replay-safe: provenance is baked into the journaled Action.

## Test — `tools/test_s03_u112_gateway_dark_world.js` 32/0 (real DUEL path, every segment Replay-audited)
- A legality; B cost / mandatory discard (cancel attempt) / ベージ auto Special Summon / draw / +300 / once per turn;
  C continuous +300 both sides, Fiends only.
- D1 ブラウ own-side discard → 1 draw, no prompt; D2 the opponent's real 手札抹殺 → ブラウ draws 2, ゴルド Special
  Summoned and destroys the chosen card; D3 ゴルド own-side → summoned, no destruction offered; D4 暗黒界の雷
  mandatory discard.
- E1 手札抹殺 on its own (2/2 and 3/3; P1's discards carry P3 actingPlayer 0 and count as moved by the opponent's effect); E2 暗黒界の雷 legality.
- Negative control: the same test on the pre-fix U111 build fails in B and D1–D4.
- Existing 暗黒界 tests (4 files) pass unchanged.

## Status
- 暗黒界の門, 暗黒界の雷, 手札抹殺 IMPLEMENTED → TESTED (#112–#114). The other 暗黒界 monsters were already TESTED.

## Remaining (not in this unit)
- グラファ's discard effect chooses its destruction target at resolution; the 2011 text targets on activation
  ("選択して"). Now mandatory, but the target timing is still resolution-time. Same for ゴルド's optional
  "2枚まで選択して破壊". Candidate for a follow-up unit (targeting at activation for mixed ignition/trigger scripts).

## Gate
- Full Gate `GATE_EXIT=0`, 13532 PASS lines (U111 13500 + 32), 0 FAIL, no Traceback / ReferenceError; the single caught
  `TypeError` stack at the start of `test_auto_cycle32.js` is the recorded existing noise. (The first U112 gate failed at
  `test_p3_provenance.js`; see item 5 above.)
