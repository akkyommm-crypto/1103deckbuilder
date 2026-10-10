# S03-U104 血の代償 (Cost of the Blood) IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u103_spore_20260920.zip` (Claude, U103).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U103, using U97's corrected
cross-reference: 血の代償, qty=3, tg_gadget main deck — next of the 3 remaining qty=3 main-deck candidates.

## Card

血の代償 — Continuous Trap. Real text (this project's own authoritative `data/carddata.json` 'e' field; no
Yugipedia page found under any searched English title): "500ライフポイントを払う事で、モンスター1体を通常
召喚する。この効果は自分のメインフェイズ時及び相手のバトルフェイズ時にのみ発動できる。" ("By paying 500
Life Points, Normal Summon 1 monster. This effect can only be activated during your own Main Phase and
during the opponent's Battle Phase.") No "once per turn" restriction — matches the project's own "1103では
無制限" (Unlimited as of the March 2011 format) note on the card's own comment.

## What was found

**Bug 1 (fixed this unit)**: the real timing restriction — "only during your own Main Phase and the
opponent's Battle Phase" — was entirely missing from `condition()` in `cards/00_generic_core.js`. With no
`passive` hooks and no explicit `timing` declaration, the generic `scriptTimings()` (`engine/40_legal_script
_engine.js`) defaulted to `['free']` (always-legal-timing, since `t.length===0` when no hooks exist), so the
card could be activated during **any** phase of **either** player's turn. Confirmed empirically
illegal-but-accepted before the fix: the opponent's Main Phase, the controller's own Battle Phase, and the
controller's own End Phase. Since distinguishing "your own turn" vs "the opponent's turn" for a specific
phase can't be expressed through the generic per-card `timing` whitelist (which only tracks phase kind, not
turn ownership), the fix checks `gameState.activePlayer`/`gameState.phase` directly inside `condition()`,
matching the established pattern for other custom-condition cards this session (e.g. S03-U93's カオス・
ソーサラー).

**Bug 2 (found, deliberately NOT fixed this unit — flagged as the top-priority next unit)**: `resolve()`
Special-Summons the chosen hand monster via a raw `FX_SPECIAL_SUMMON` action with **no Tribute payment or
Tribute-count check at all**, regardless of the summoned monster's real Level. Confirmed empirically: a real
Level-8 monster (a real 2-Tribute requirement) was Special Summoned for free, paying only the 500 LP. No
existing card anywhere in this codebase reuses the real tribute-selection machinery
(`normalSummonMethodsFor`/`pickTributes`, `engine/70_summon_procedures.js`, both designed as top-level
UI-action handlers) from within a script's own `resolve()` — building that generically (a real
`API.requestChoice`-based in-resolve tribute picker, correctly handling Level-based tribute counts and any
double-value/Gemini-style tribute exceptions) is a genuine engineering task, not a quick fix. Given the two
bugs are architecturally independent (different code paths, independently fixable/testable), and given the
established session precedent for splitting compound findings when the second issue is substantially larger
in scope (e.g. U66→U67, U67→U68→U69, U94→U95), this unit scopes to the timing fix only.

## Fix

`cards/00_generic_core.js`, 血の代償's `condition()`: added an explicit check —
`gameState.activePlayer===ctx.player && (phase==='main1'||phase==='main2')` (own Main Phase) OR
`gameState.activePlayer===ctx.opponent && phase==='battle'` (opponent's Battle Phase) — before the
pre-existing LP/mz-space/hand checks. No engine change; single-card fix (timing only; the Tribute-bypass
bug is explicitly deferred).

## Dedicated test

`node tools/test_s03_u104_cost_of_the_blood.js` — 11 assertions, all pass, real DUEL path throughout.
Deliberately uses only no-Tribute-required (Level ≤ 4) hand monsters throughout, to avoid conflating this
unit's fix with the separately-flagged Tribute-bypass bug.

- **A**: real activation during the controller's own real Main Phase — really pays the real 500 LP and
  really Special Summons a real Level-4 hand monster in real Attack Position.
- **B**: real activation during the real **opponent's** real Battle Phase — the fixed bug's positive
  real-text case, confirming this unusual cross-turn window really works.
- **C**: real negative controls (the fixed bug) — illegal during the opponent's Main Phase, the
  controller's own Battle Phase, and the controller's own End Phase.
- **D**: real negative controls (pre-existing, unchanged) — illegal with LP<500, an empty hand, or a full
  Monster Zone.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (血の代償).
- `CARD_TEST_FOCUS` given an explicit `{"血の代償"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 105 declared status changes (+1 from U103's 104), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13389 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u104_full_gate.log`).

## Real-duel measurement

- `R1_DECKS=tg_gadget,karakuri R1_RESPOND=1`, seed `0x5`, first=0 — completed cleanly, turn 13,
  `replay.ok:true`.
- `R1_DECKS=tg_gadget,tg_skill R1_RESPOND=1`, seed `0x2`, first=1 — completed cleanly, turn 4,
  `replay.ok:true`, `digestDiff:null`. 血の代償 was actually present in P0's opening hand.

Both: `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`30c4b786980e2055ac3b3d505e364278b3ecfd63d52090672a06bfa97ca03f6b` (862 files).

## Remaining

**Top priority for the next unit**: fix 血の代償's Tribute-bypass bug (Bug 2 above) — the only real card in
this codebase whose "treated as a Normal Summon" effect needs a resolve()-time Tribute-selection flow.
Recommended approach: build a small `API.requestChoice`-based tribute picker reusing
`normalSummonMethodsFor(db,p,'summon')`/`tributeValueOptions` to determine the real required Tribute count
and candidates, matching the shape (but not the UI-bound implementation) of `chooseNormalSummonMethod`/
`pickTributes` in `engine/70_summon_procedures.js`. Otherwise: 2 more qty=3 main-deck IMPLEMENTED candidates
remain from U97's cross-reference — TG ラッシュ・ライノ, TG1－EM1 (both tg_skill) — then the Extra Deck tier.
Re-run the cross-reference fresh at the start of the next unit rather than trusting this list verbatim.
