# S03-U87 TG ワーウルフ / TG ストライカー IMPLEMENTED→TESTED + Special-Summon-Level/scope fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u86_seven_tools_20260919.zip` (Claude, U86).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U86. The next-highest-consumer-count
main-deck IMPLEMENTED candidate is TG ワーウルフ (T.G. Warwolf, qty=6 across tg_skill/tg_gadget of the 13
fixed decks).

## What was found

Real text (confirmed via Yugipedia): "When a Level 4 or lower monster(s) is Special Summoned (except during
the Damage Step): you can Special Summon this card from your hand. Once per turn, during the End Phase, if
this card is in the GY because it was destroyed on the field and sent there this turn: You can add 1 'T.G.'
monster from your Deck to your hand, except 'T.G. Warwolf'."

Reading the existing implementation (`cards/10_themes_a.js`) surfaced real gaps, shared identically by
TG ストライカー (same file, same missing clause):

1. Clause ①'s condition only checked `API.me(ctx).ssHistory.length` — the controller's OWN Special Summons,
   regardless of Level. It never triggered off the opponent's Special Summons (real text has no "your"
   qualifier), and incorrectly triggered off a Special Summon of ANY Level (e.g. a Level 8 monster).
2. This engine's card database reuses the `lv` field to also store Xyz Rank (confirmed empirically: No.39
   希望皇ホープ has `lv:4` in `data/carddata.json` even though real 2011-era rulings treat Xyz Monsters as
   having no Level). A naive `lv<=4` fix would have incorrectly counted a Rank≤4 Xyz Summon.
3. Clause ② (the End Phase GY-search) was entirely missing from both cards.

## Fix

- Extended `ssHistory` (`engine/00_state_actions.js`, all 4 push sites: `FX_SPECIAL_SUMMON`,
  `EX_SUMMON_COMMIT_V42`, `FX_EX_SUMMON`, the Ritual Summon case) to also record `lv` (via the existing
  `curLV()` getter, computed at the same point the pre-existing `sentLv`/`v380SummonMaterials` snapshots are
  taken) and `specialSummonKind` (already present on the card object at that point). Purely additive — no
  existing consumer of `ssHistory` reads these new fields.
- `cards/10_themes_a.js`: clause ①'s condition now scans BOTH players' `ssHistory` for this turn, requiring
  `lv<=4 && kind!=='xyz'` (`tgLv4SpecialSummonedThisTurnS03U87`).
- Added clause ② for both TG ワーウルフ and TG ストライカー, merged into each card's existing single
  `defineScript` registration (a card name maps to exactly one script; the two clauses branch internally on
  `ctx.zone`, matching the established precedent TG ワンダー・マジシャン). Clause ② reuses the exact
  `graveInfo`-based "destroyed on the field, sent to GY this turn" pattern from ドル・ドラ
  (`cards/D2_auto_cycle30.js`) plus the existing `s03u58.deck-search` registered choice handler. A
  per-card-instance "used this turn" flag (`API.setCardFlag`, the Replay-safe custom-state pattern
  established in S03-U79) tracks clause ②'s own once-per-turn limit independently of clause ①'s natural
  one-shot-per-instance behavior, so a single copy that Special Summons itself via ① and is later destroyed
  the same turn can still use ② in that turn's End Phase — a real interaction the shared card text permits.
- `cards/H5_claude_s03_activation_response.js`'s pre-existing S03-U47 declaration
  (`'TG ワーウルフ': link=>link.eventName!=='onEndPhase'`) already anticipated this exact `onEndPhase`
  eventName for clause ②, confirming the chosen shape matches infrastructure prepared for it earlier this
  session.

## Dedicated test

`node tools/test_s03_u87_tg_warwolf_striker.js` — 15 assertions, all pass, real DUEL path throughout:

- **A**: the opponent really activates ワン・フォー・ワン (a real Spell), really discarding a real hand
  monster as cost and really Special Summoning a real Level 1 monster from the Deck; TG ワーウルフ in the
  controller's own hand becomes a real legal activation once that chain fully resolves (the either-player
  fix), and really Special Summons itself.
- **B**: negative control — a Special Summon of a real Level 8 monster does not trigger TG ワーウルフ.
- **C**: negative control — a real Xyz Summon of No.39 希望皇ホープ (Rank 4) from 2 real Level 4 materials
  does not trigger TG ワーウルフ (Xyz Monsters have no Level for this purpose).
- **D**: TG ワーウルフ, really destroyed on the field and sent to the GY this turn, is a real legal
  activation at the real End Phase; resolving it really adds TG ストライカー from the Deck to hand (a real
  registered-handler search, excluding TG ワーウルフ itself); confirms the once-per-turn ② flag does not
  block a hypothetical fresh copy's own ① later the same turn.
- **E**: negative control — TG ストライカー sent to the GY by discard (not destroyed on the field) does not
  offer ②; regression-checks TG ストライカー's own clause ① (state-based, unaffected by the `ctx.zone`
  branching refactor needed to host both clauses in one script).

Every Replay-audited segment reproduces every digest.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -2, `TESTED` +2 (TG ワーウルフ, TG ストライカー).
- `CARD_TEST_FOCUS` given an explicit `{"TG ワーウルフ", "TG ストライカー"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 89 declared status changes (+2 from U86), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13242 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Fresh R1 sweep, TG Gadget vs TG Skill (both decks carry TG ワーウルフ/TG ストライカー), seeds 0x1-0x4 x
first-player {0,1}: **8/8 clean**, every run `completed:true`, `blocker:null`, `errors:[]`,
`unsupported:[]`, `replay.ok:true`.

## An operational note (self-correction during this unit)

Two testing pitfalls surfaced while building the dedicated test, both fixed before publication and worth
recording for future writers:

1. `duelActivateFromHand(i)` takes a **hand index**, not a player number — the active player is read from
   `gameState.activePlayer` internally. An early draft passed a player number by mistake and silently
   activated the wrong (or no) card.
2. Manually assigning `gameState.phase='end'` in a test bypasses the journaled phase-transition action, so a
   Replay audit taken afterward correctly reports a digest mismatch (the replay recomputes state from the
   action journal alone, which never recorded that raw assignment). The fix is `act({type:'SET_PHASE',
   phase:'end'})` — the same real production action a genuine phase transition uses — matching the existing
   precedent in `tools/test_s03_u53_instant_fusion.js`.

Neither of these was a bug in the card or engine fix itself — both were purely test-authoring mistakes caught
by the Replay audit doing exactly what it is meant to do.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`31304167576e512079874fea568e4c037dfedb3eb81cd5739817b18f1d4c034f` (829 files).

## Remaining

- Priority #7's IMPLEMENTED tier remains large. Next candidates by consumer count (from the S03-U83 cross-
  reference, re-verified periodically): A・O・J カタストル / インヴェルズ・ローチ (qty=10 each, Extra Deck),
  氷結界の龍 ブリューナク (qty=8, Extra Deck), No.39 希望皇ホープ (qty=8, Extra Deck Xyz — now also directly
  exercised by this unit's own dedicated test), TG ハイパー・ライブラリアン (qty=6, Extra Deck). The
  main-deck tier is now largely exhausted; remaining candidates are predominantly Extra Deck.
- 六武衆の影武者, 天刑王 ブラック・ハイランダー, E・HERO アブソルートZero, 波動竜騎士 ドラゴエクィテス all
  remain deferred pending genuinely new capabilities.
