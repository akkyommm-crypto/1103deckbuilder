# S03-U89 リビングデッドの呼び声 IMPLEMENTED→TESTED + leave-field/mutual-destruction fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u88_dust_tornado_20260919.zip` (Claude, U88).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U88. The next-highest-consumer-count
main-deck IMPLEMENTED candidate is リビングデッドの呼び声 (Call of the Haunted, qty=5 across
bf/dark/debris/jurrac/tg_gadget of the 13 fixed decks).

## Card

リビングデッドの呼び声 (Call of the Haunted) — this project's own card database, a Continuous Trap printed
well before the 2011-08-31 cutoff. Real text (confirmed via Yugipedia): "Activate this card by targeting 1
monster in your GY; Special Summon that target in Attack Position. When this card leaves the field, destroy
that monster. When that monster is destroyed, destroy this card."

## What was found

Reading the existing implementation (`cards/00_generic_core.js`) surfaced a real, previously-undiscovered
gap: only the activation itself (target 1 GY monster, Special Summon in Attack Position) was implemented.
The entire leave-field/mutual-destruction pair of clauses — the card's second and third sentences — was
missing entirely. This is a real missing feature, not just a missing test: without it, the Special Summoned
monster and リビングデッドの呼び声 itself had no linked lifecycle at all, meaning (for example) destroying
the summoned monster left リビングデッドの呼び声 sitting on the field forever, contrary to its printed text.

Yugipedia's Rulings page confirms the real card text is deliberately **asymmetric**:
- "When this card leaves the field, destroy that monster" — unconditional on this card's own leave reason
  (destroyed, bounced, etc.).
- "When that monster is destroyed, destroy this card" — specifically gated on the monster being **destroyed**,
  not any leave-field reason (e.g. Tributed for a Synchro Summon, or bounced by an effect).

## Fix

Converted the card from a plain `defineScript` to `defineUnifiedCardV4` with two effect entries, reusing the
existing System v9 linked-lifecycle primitive (`engine/18_leave_field_v9.js`, `API.linkOnLeave`) already
proven by リミット・リバース (`cards/HE_claude_s03_u56_limit_reverse.js`):

- **Direction 1** (monster → self): `API.linkOnLeave(revived, self, 'destroy', ...)` — the summoned monster
  itself holds a watch entry on リビングデッドの呼び声; when リビングデッドの呼び声 leaves the field for
  ANY reason, the monster is destroyed. Matches the unconditional first clause exactly.
- **Direction 2** (self → monster, asymmetric): rather than reusing the generic `linkMutual` helper (which
  would fire symmetrically on ANY leave-field reason for both directions — over-broad for this card),
  リビングデッドの呼び声 registers a bookkeeping-only watch entry (`API.linkOnLeave(self, revived, 'none',
  ...)`, `onGone:'none'` deliberately performs no automatic action) purely so a dedicated forced
  `EFFECT_TYPE.TRIGGER` entry on the `onDestroy` broadcast event can check `API.linkState(self)` for a
  matching watched uid and destroy itself ONLY when the monster is specifically destroyed — matching the
  real text's asymmetry precisely.

Confirmed via `engine/40_legal_script_engine.js`'s `collectHandlers()` that `onDestroy` is a genuine
broadcast event (scanned across every card on both players' fields, not a self-only hook), making this
watch-based cross-card reaction pattern valid.

## Dedicated test

`node tools/test_s03_u89_call_of_the_haunted.js` — 15 assertions, all pass, real DUEL path throughout.

- **A**: a real activation really Special Summons the targeted GY monster in real Attack Position; the card
  itself really stays on the field as a Continuous Trap.
- **B**: a real battle destruction of the Special Summoned monster really also destroys リビングデッドの
  呼び声 (the "monster destroyed → destroy this card" clause).
- **C**: a real 砂塵の大竜巻 (Dust Tornado, S03-U88) destruction of リビングデッドの呼び声 really also
  destroys the Special Summoned monster (the mutual link firing in the opposite direction — "this card
  leaves → destroy monster").
- **D**: a real negative control — the monster leaves the field by a non-destroy reason (a real bounce to
  hand); リビングデッドの呼び声 correctly stays on the field (confirming the asymmetric fix: only
  "destroyed" triggers self-destruction, not any leave).
- **E**: real negative controls for no GY monster at all and a full Monster Zone.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (リビングデッドの呼び声).
- `CARD_TEST_FOCUS` given an explicit `{"リビングデッドの呼び声"}` entry for this test file (fixtures used:
  ワイト, もけもけ, バット, 青眼の究極竜, 砂塵の大竜巻 — 砂塵の大竜巻 was already TESTED from U88, unchanged
  here; none newly promoted).
- `python tools/s03_status_audit.py`: EXIT 0, 91 declared status changes (+1 from U88), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13264 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Fresh R1 sweep, BF vs Jurrac (both decks carry リビングデッドの呼び声; a pre-fix sweep of this same pair was
already clean at 7/7 earlier this session — re-swept here as a regression check on the new linked-lifecycle
mechanism), seeds 0x1-0x4 x first-player {0,1}: **8/8 clean**, every run `completed:true`, `blocker:null`,
`errors:[]`, `unsupported:[]`, `replay.ok:true`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`c07177cc1bce94edbd65ee4a6ed5a386ef3c7649ea55c68e228aa699f578f347` (833 files).

## Remaining

Priority #7's IMPLEMENTED-tier main-deck candidates continue: ダスト・シュート (qty=4, agent/bf/six/worm),
朱光の宣告者 (qty=3, agent), 墓穴の道連れ (qty=3, dark), カオス・ソーサラー (qty=3, debris), ライトロード・
ハンター ライコウ (qty=3, debris), ミラクル・フュージョン (qty=3, hero), plus more at qty=3 and below not yet
fully enumerated — re-run the cross-reference for the complete current list. The Extra Deck tier remains
separately available: A・O・J カタストル / インヴェルズ・ローチ (qty=10 each), 氷結界の龍 ブリューナク
(qty=8), No.39 希望皇ホープ (qty=8), TG ハイパー・ライブラリアン (qty=6). 六武衆の影武者, 天刑王 ブラック・
ハイランダー, E・HERO アブソルートZero, 波動竜騎士 ドラゴエクィテス all remain deferred pending genuinely
new capabilities.
