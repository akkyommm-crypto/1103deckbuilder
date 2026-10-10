# S03-U74 ワーム・ゼクス PARTIAL→TESTED + battleProof() cache-poisoning fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u73_reinforce_truth_20260919.zip` (Claude, U73).

## Why this unit

Continues U72/U73's priority #7 pass over the remaining PARTIAL AUTO_DECK_TABLE cards on the fixed major-deck
lists. ワーム・ゼクス (Worm Xex), a x1+ Worm-deck monster, was classified PARTIAL under the same reason as
U72's Gadgets and U73's トゥルース・リインフォース.

## Card

Worm Xex (Yugipedia, within the 2011-08-31 cutoff): "When this card is Normal Summoned, you can send 1
Reptile-type 'Worm' monster from your Deck to the Graveyard. If you control a face-up 'Worm Yagan', this card
cannot be destroyed by battle."

## What was wrong — three real gaps in the table version

1. The table entry's `f.group` field is **dead metadata** — `autoDeckMatches()` (`cards/40_auto_interpreter.js`)
   never actually reads `f.group`, only `f.ra`/`f.tk`/`f.arch`/etc. So the table's real filter was only
   "Reptile-type monster" — it would have allowed milling *any* Reptile in the deck, not specifically a
   "Worm"-named one as the real text requires.
2. `trig:"summon"` unconditionally wires both `onNormalSummon` **and** `onSpecialSummon` — but the real text
   is Normal-Summon-only.
3. The table has no way to express a standalone continuous clause at all (same class of gap as U73's
   Battle-Phase lock): the "cannot be destroyed by battle while you control a face-up Worm Yagan" clause was
   entirely missing.

## Fix

New file `cards/HJ_claude_s03u74_worm_xex.js`: a real literal `defineScript`, built from already-established
primitives — the non-targeting Deck-mill choice resolves at resolution time via the existing `s03u58.deck-mill`
handler (precedent: おろかな埋葬／終末の騎士／ダーク・グレファー) with a corrected archetype-name filter
(`String(db.n).indexOf('ワーム')>=0`, matching the established idiom), `onNormalSummon` only, and
`continuous.battleProof(card)` (precedent: カラクリ守衛 参壱参, S03-U71) checking for a real face-up
ワーム・ヤガン by name — only its physical field presence, not any of its own effects (still NOT_STARTED,
deliberately deferred since S03-U71's report).

## A real, previously-undiscovered shared engine bug found and fixed

Building the `continuous.battleProof` clause surfaced a real bug in `battleProof()`
(`engine/00_state_actions.js`), the shared function every real battle destruction check consults:

- The function's fallback layer (used when a script sets no static `sc.battleProof`) infers battle-proofness
  by regex-matching the card's raw OCG text for "戦闘では破壊されない" and then **caches the result forever,
  keyed by card name** — a reasonable heuristic for cards with an *unconditional* battle-proof clause.
- But a card with a *conditional* clause (e.g. "while you control a face-up X") still has that exact phrase in
  its raw OCG text (the condition is described in the same sentence). Once `battleProofGrantedV15` (which
  correctly evaluates the card's own `continuous.battleProof(card)` function) ever returned `false` for such a
  card at a moment the condition happened not to hold, the code fell through past that authoritative dynamic
  answer into the cache/regex layer — which matched the phrase unconditionally and cached `true`, permanently,
  for that card **name**. Every subsequent evaluation whose dynamic check also returned `false` would then be
  silently overridden by the poisoned cache.
- **This was not a new bug introduced by this unit — it was already live in the currently-published
  checkpoint**, silently affecting **カラクリ守衛 参壱参** (S03-U71, already checkpointed): the first time its
  condition (`card.pos==='atk'`) was ever satisfied in a real duel, the cache would poison to `true`
  permanently, meaning it would incorrectly stay "cannot be destroyed by battle" even after flipping to
  Defense Position (its own clause② can do this to itself), a genuine wrong-result bug in a major-deck card.
  Confirmed via direct reproduction before applying the fix (`battleProof(saizan)` with `pos:'atk'` then
  `pos:'def'` — second call incorrectly returned `true`).

### Fix

`engine/00_state_actions.js`, `battleProof(card)`: after the static `sc.battleProof` check and before the
cache/text-inference fallback, added — a card whose own script declares `continuous.battleProof` as a
**function** has already had its authoritative answer computed by `battleProofGrantedV15` above (which
returned `false` to reach this point); that answer is now trusted as final and the cruder fallback is skipped
entirely for such cards. No other card is affected: cards with a static `sc.battleProof`, no
`continuous.battleProof` at all, or any other shape are completely unchanged.

```js
if(sc && sc.continuous && typeof sc.continuous.battleProof === 'function') return false;
```

Empirically confirmed fixed for both affected cards: カラクリ守衛 参壱参 (ATK→`true`, DEF→`false`, no longer
stuck) and ワーム・ゼクス (with/without ワーム・ヤガン, correctly tracks real-time field state).

## Dedicated test

`node tools/test_s03_u74_worm_xex.js` — 8 assertions, all pass, real DUEL path throughout.

- **A**: real Normal Summon, deck holds both a real Worm Reptile (ワームドレイク) and a real non-Worm Reptile
  (くちばしヘビ) — confirms the resolution-time mill choice is really filtered to just the Worm one (the fix
  for the table's dead `group` field), and the real mill happens.
- **B**: real Special Summon (not Normal Summon) — confirms the mill is **not** offered, matching the real
  Normal-Summon-only text (the table's own bug, also fixed).
- **C**: `battleProof()` directly, with and without a real face-up ワーム・ヤガン on the field — confirms it
  correctly tracks real-time state both ways.
- **D** (shared-fix regression): re-confirms カラクリ守衛 参壱参 (the already-published S03-U71 card) is no
  longer permanently poisoned to battle-proof after its condition is ever true once — ATK `true`, then DEF
  genuinely `false`.

## Coverage / status audit

- `python tools/script_coverage.py`: `PARTIAL` 173→172 (-1), `TESTED` 2120→2121 (+1).
- `python tools/s03_status_audit.py`: EXIT 0, 76 declared status changes, **off-target status changes = 0**.

## Gate

- `python tools/check.py` — EXIT 0, **13120 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no duplicate
  top-level function declarations.

## Real-duel measurement

Karakuri vs Worm — a previously-untried fresh pair, chosen deliberately because it exercises **both** cards
affected by the shared `battleProof()` fix (カラクリ守衛 参壱参 and ワーム・ゼクス) in the same real duels —
swept across all 8 seed/first-player combinations: **8/8 clean**, every run `completed:true`, `blocker:null`,
`errors:[]`, `unsupported:[]`, `replay.ok:true`. One opening hand drew ワーム・ゼクス directly; another drew
ワーム・ヤガン (still NOT_STARTED, unaffected). Karakuri vs Worm is now a fully confirmed clean major-deck pair.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`2987cadc0faf9ef9919d68bfc540800b1c251344dc8536d0eaf4a2217e8529b1` (797 files).

## Remaining

- The last known PARTIAL AUTO_DECK_TABLE card on the fixed lists: シューティング・クェーサー・ドラゴン
  (Debris) — same audit-then-fix treatment; left for a future unit.
- Per the fixed fallback order, continuing directly into the next Requirement.
