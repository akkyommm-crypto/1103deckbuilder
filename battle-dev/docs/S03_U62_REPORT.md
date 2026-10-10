# S03-U62 legacy-choice (API.selectCard/API.confirm) SaveLoad migration (Claude)

Base: shared LATEST `checkpoint_claude_s03_u61_trap_field_reactivation_guard_20260918.zip` (Claude, U61).

## Why this unit

Fixed fallback order after U60/U61 closed the field-reactivation bug class: no idle stop on the clean
post-U61 sweeps, so the next item is the Ready-queue's oldest carried-over item (WORK_QUEUE, traced back to
S03-U41/U49): legacy `resolve()`/`operation()`-time choices made via `API.selectCard`/`API.confirm`
(`engine/40_legal_script_engine.js`) cannot survive a save/reload — the continuation is a bare JS closure
held only in the transient `CHOICE_LEGACY_CB_V49` side table (`engine/09_choice_request_v49.js`), never
journaled. On reload, `reconcileChoiceAfterLoadV49()` deliberately drops any such pending choice rather than
corrupt state (a documented, intentional "safe abort") — but that means the card's effect silently never
completes: a real "wrong result" class bug whenever a duel is saved mid-choice on one of these cards.

## Measurement (before committing to the fix)

Confirmed the bug for real before treating it as a Requirement: activated 地割れ (Landslide) against two
tied-lowest-ATK opponent monsters, reaching its legacy tiebreak choice mid-resolution, then did a real
SaveLoad round-trip into a fresh VM. Result: the pending choice was silently dropped and **neither monster
was ever destroyed** — a genuine divergence from what the activation should have done, not merely a missed
edge case.

## Audit

Every `CARD_SCRIPTS` entry whose `resolve()` (legacy) or V4 `operation()` calls `API.selectCard`,
`API.confirm`, or `openPick` — **48 cards** (40 via `API.selectCard`/`openPick`, 8 via `API.confirm`, 6
counted in both). Migrated all 48 to `API.requestChoice` + a named `API.registerChoiceHandler` continuation
— the same SaveLoad-safe P1 ChoiceRequest pattern already established by S03-U41/U49/U58/U59/
`79_p1_choice_recovery_minibatch.js` — reusing the existing shared helper (`v49P1Open`) where the original
was already a straightforward single-step pick, and hand-written `requestChoice` + handler pairs for the
recursive/multi-step/nested-confirm cases.

### Behavior preservation

`API.selectCard` is *always* cancelable (hardcoded in its own implementation) and its `onPick` callback
simply never runs on cancel — so the original "cancel anywhere aborts every remaining step" shape had to be
preserved deliberately: a registry-handler continuation (unlike a legacy `onPick`) is invoked on cancel too
(with `answer.cancelled:true`, empty candidates — the same lesson U60 already learned about this pipeline),
so every converted handler explicitly guards on `!picks[0]`/`answer.cancelled` before doing anything, rather
than letting later steps run unconditionally.

### Two real, pre-existing bugs found and fixed along the way

Found by that same discipline, not introduced by it — both from calling the async, choice-opening legacy
helpers **synchronously more than once in the same tick**, where the second call silently overwrote the
first pending choice before the player could ever answer it:

- **マッド・リローダー** (`cards/A8_auto_cycle06.js`): a `for` loop called `API.selectCard` twice in a row;
  only the second (overwriting) choice was ever answerable, so only 1 of the intended 2 hand cards was ever
  discarded, and the draw fired immediately — before either choice resolved — instead of after both. Fixed:
  rewritten as two sequential `requestChoice` steps, draw only after both discards.
- **尾も白い黒猫** (`cards/9V_class_a_flip_bulk.js`): the self-bounce `API.selectCard` fired synchronously
  right after opening the (already SaveLoad-safe) opponent-bounce `v49P1Open` choice, overwriting it — the
  opponent-bounce choice was never actually answerable, only the self-bounce ever happened. Fixed: self-
  bounce now resolves first, then opens the opponent-bounce choice.

Both fixes were verified via a real, non-stubbed real-duel-path reproduction of the original bug (only one
card actually discarded / only one bounce actually happening) before and after the fix.

### Status promotions

Three cards gained genuine, comprehensive real-DUEL-path test coverage for the first time in this unit and
were promoted IMPLEMENTED → TESTED (declared in `data/s03_status_changes.json`, unit S03-U62): 地割れ,
暗黒界の取引, 氷結界の龍 トリシューラ — the three given full real-duel + SaveLoad-round-trip coverage in the
dedicated test (see below). The other 45 converted cards were already TESTED via their own existing
dedicated tests (which needed updating — see next section — but already counted as acceptance evidence).

## Pre-existing test fallout (not a new bug — the old tests assumed the old, unsafe synchronous behavior)

21 existing test files call `sc.resolve()`/`effect.operation()` directly against a monkey-patched
*synchronous* `API.selectCard`/`API.confirm` stub (`API.selectCard=(t,list,cb)=>cb(list[0])`, a pattern
predating the P1 ChoiceRequest system) and assert on the immediately-following state. Since the converted
cards now open a real, asynchronous `API.requestChoice` instead, those stubs no longer intercept anything,
and the assertions ran against not-yet-resolved state. Updated all 21 to drive the real pending choice (a
small `drain0()`/`drain47()` helper that auto-picks candidate 0, matching each stub's own semantics, added
once per file and reused) instead of relying on the synchronous stub — this is fixing the *test* to match
the new, correct architecture, not a behavior change to any card: `tools/test_v470_native_cards.js`,
`tools/test_ritual_cards.js`, `tools/test_battle_cards.js`, `tools/test_leave_field_cards.js`,
`tools/test_class_a_bulk50_b1.js`, `tools/test_ready25_b2.js`, `tools/test_auto_cycle05.js`,
`tools/test_auto_cycle06.js`, `tools/test_auto_cycle13.js`, `tools/test_auto_cycle31.js`,
`tools/test_auto_cycle38.js` (11 files needed a real code change; the other ~10 candidate files touched no
affected path and needed nothing).

## Dedicated test

`node tools/test_s03_u62_legacy_choice_migration.js` — 23 assertions, all pass, real DUEL path throughout:

- **A.** 地割れ: the bug that started this unit, reproduced and fixed — a SaveLoad round-trip mid-choice now
  restores the pending choice (registry resume mode) and completes correctly (destroys a monster for real)
  in the reloaded VM.
- **B.** 暗黒界の取引 (major-deck card): full 2-step real-duel cycle, then a second run confirming the
  second (opponent-side) choice also survives a SaveLoad round-trip and completes correctly.
- **C.** 氷結界の龍 トリシューラ: 3-step recursive real-duel cycle, triggered via a real Special Summon (not
  a direct `resolve()` call) so the card's own `condition()`/passive fire for real.
- **D.** マッド・リローダー: confirms the sequencing-bug fix — both hand cards are now discarded, not just
  one.
- **E.** 尾も白い黒猫: confirms the sequencing-bug fix — the opponent-bounce choice is no longer silently
  skipped.
- **F.** 酒呑童子: a converted `API.confirm`-based (yes/no) card, full real-duel cycle.

## Real-duel measurement

R1 sweeps (`R1_LIST=v1`, `R1_RESPOND=1`), real DUEL game path: 【Dragunity】 vs 兎ラギア (seeds
`0x62010001`–`0x62010002`, both first-player orders, 4 duels) and 【Dark World】 vs 兎ラギア (the deck
containing several converted 暗黒界 cards, seed `0x62020001`, both orders, 2 duels): **6 / 6 completed**,
`blocker: null`, `unsupported: []`, Replay ok in every duel.

## Gate

- `python tools/check.py` — EXIT 0, **12930 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u62_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 48 declared status changes observed (45 carried forward + 3
  new promotions this unit), 0 off-target, TOTAL 4996.
- Coverage: TESTED 2094 → 2097 (+3), IMPLEMENTED −3 (the three promoted cards).
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`98eed8c4b1a99f5802fbf3c43212eec9af1ee56720333abfafeb1a1f58d70ce9` (764 files).

## Remaining

- No further `resolve()`/`operation()`-time `API.selectCard`/`API.confirm`/`openPick` calls remain among
  `CARD_SCRIPTS` (re-audited after the fix — 0 candidates).
- `cost`/`selectTargets`-phase (activation-time, pre-chain) uses of `API.selectCard` were intentionally left
  untouched — out of this unit's audited scope (that class was already addressed by S03-U58's resolution-
  choice pattern for the specific cards it covered; a full audit of the cost/selectTargets-phase population
  would be a separate, similarly-scoped follow-up if a real-duel measurement surfaces a gap there).
- Per the fixed fallback order, continuing directly into the next Ready-queue item / a fresh real-duel
  sweep to find the next blocker.
