# S03-U82 A・O・J ディサイシブ・アームズ NOT_STARTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u81_bf_silverwind_20260919.zip` (Claude, U81).

## Why this unit

Continuing priority #7 directly from S03-U79's own cross-reference pass (candidate list logged in
WORK_QUEUE.md, refined in U81's own report). 天刑王 ブラック・ハイランダー was assessed and found to need a
genuinely new capability (a Synchro-Summon-specific global lock); the two Fusion candidates (E・HERO
アブソルートZero, 波動竜騎士 ドラゴエクィテス) were assessed and found to need the entire generic
Fusion-Summon-from-hand mechanic, which turned out to be completely unimplemented in this codebase (融合
itself is NOT_STARTED, referenced only as a name-string fixture in over a dozen test files) — both correctly
deferred, matching the established precedent for シューティング・クェーサー・ドラゴン/W星雲隕石. A・O・J
ディサイシブ・アームズ (Six Samurai main deck) was the remaining candidate and found tractable.

## Card

A・O・J ディサイシブ・アームズ (this project's own card database, printed 2009-07-01, within the
2011-08-31 cutoff), a DARK Machine Synchro Effect Monster, Level 10 (Tuner + 2 or more non-Tuner monsters,
no archetype-name restriction on either): if the opponent controls a face-up LIGHT monster, once per turn
activate 1 of 3 modes:

1. Select 1 set card your opponent controls and destroy it.
2. Send 1 card from your hand to the GY; destroy all Spell/Trap Cards your opponent controls.
3. Send your entire hand to the GY; check your opponent's hand and send all LIGHT monsters among them to the
   GY, then inflict damage to your opponent equal to the total ATK of the monsters sent to the GY by this
   effect.

## Design

Reuses the established P1.1 "choose 1 of N modes, then a mode-specific follow-up" pattern end to end
(precedent: 竜の渓谷, `cards/89_p11_activation_choice_recovery.js`'s own `p11cards.mode` /
`p11cards.cost-commit` / `p11cards.commit-targets` registered handlers) — mode 1 opens a real targeting
choice, mode 2 opens a real cost-discard choice, mode 3 pays its own "discard your entire hand" cost directly
(no selection needed, matching the established "手札を全て墓地へ" precedent, `cards/20_control_counter.js`'s
own 闇の誘惑). Reading the opponent's hand for mode 3 reuses the same direct-array-scan already established
for マインドクラッシュ (`cards/00_generic_core.js`) — this engine keeps full server-side state, so no
separate "reveal" primitive is needed.

## A real pitfall found and fixed while building this

The first draft declared the card via `defineUnifiedCardV4` with a single effect entry, branching on
`ctx.v4EffectKey` inside its `resolve()` to pick the mode — mirroring how `ctx.v4EffectKey` is used in
竜の渓谷. But 竜の渓谷 is a plain `defineScript` card. For `defineUnifiedCardV4`, the V4 framework's own
auto-generated `sc.resolve` dispatcher uses `ctx.v4EffectKey` to decide **which of the card's declared effect
entries** (matched by their own `EFFECT_TYPE`/`key`) to invoke — it is not free data a card script can
repurpose for its own mode selection. Since none of the effect entries' own keys matched the mode strings
(`'destroy-set'`, `'wipe-st'`, `'mill-light'`), the dispatcher silently invoked nothing at resolution — the
chain resolved cleanly, no error, but none of the 3 modes' actual effects ever happened. Fixed by declaring
the card via plain `defineScript` instead (matching 竜の渓谷's exact precedent shape), where `ctx.v4EffectKey`
carries through as ordinary, unreserved context data.

New file `cards/HP_claude_s03u82_aoj_decisive_armor.js`.

## Dedicated test

`node tools/test_s03_u82_aoj_decisive_armor.js` — 13 assertions, all pass, real DUEL path throughout.

- **A**: a real Synchro Summon (ジュラック・アウロ Tuner + 青眼の白龍 + ワイト, Level 10, no archetype
  restriction) really produces the card; a real mode-1 activation destroys a real set opponent card.
- **B**: a real mode-2 activation with a real 1-card hand-discard cost really destroys both real opponent
  Spell/Trap cards.
- **C**: a real mode-3 activation discards the entire real hand as cost, then really mills only the real
  LIGHT-attribute cards from the opponent's real hand (a real DARK card in the same hand stays untouched) and
  deals real damage equal to their total ATK.
- **D**: a real negative control — illegal without any real opponent LIGHT monster.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `NOT_STARTED` -1, `TESTED` +1 (A・O・J ディサイシブ・アームズ).
- `CARD_TEST_FOCUS` given an explicit `{"A・O・J ディサイシブ・アームズ"}` entry for this test file — all
  Synchro-material and opponent board/hand fixtures are genuinely exercised but promoting them is out of this
  unit's scope, same precedent as U76/U79/U80/U81.
- `python tools/s03_status_audit.py`: EXIT 0, 82 declared status changes (+1 from U81), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13202 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Not independently re-confirmed via a fresh R1 sweep of a specific fixed-list pair this unit; the dedicated
real-path test above is this unit's evidence. A future Six-Samurai-including sweep would exercise this card
incidentally.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`7b2b549074829cb2975d81d6556fd3d5a569af4ef1dfe775e59aa558f10d2583` (819 files).

## Remaining

- 六武衆の影武者 remains the one genuine ENGINE_GAP needing a real new capability — left for a future unit.
- 天刑王 ブラック・ハイランダー needs a genuinely new Synchro-Summon-specific global lock capability — deferred.
- E・HERO アブソルートZero, 波動竜騎士 ドラゴエクィテス need the entire generic Fusion-Summon-from-hand
  mechanic (confirmed unimplemented: 融合 itself is NOT_STARTED) — deferred, a large capability, out of scope
  for a single focused unit.
- The optional P3 real-path confirmation follow-up (突風 + 11 `cards/88_p3_provenance_recovery.js` cards,
  surfaced in S03-U79) remains open, no known bug.
- Per the fixed fallback order, continuing directly into the next Requirement.
