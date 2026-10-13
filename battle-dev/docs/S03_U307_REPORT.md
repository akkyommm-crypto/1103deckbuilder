# S03-U307 — ジェムナイト・アイオーラ / ジェムナイト・アンバー (Gemini) and the P4 groups 「ジェム」 / 「ジェムナイト」

Base: `claude/work` `9be5c28` (U305 / U306, gate 18202 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Why
- WORK_QUEUE Ready item 1 (U148 left both cards out because 「ジェム」 / 「ジェムナイト」 membership needs the P4 authority, not name matching at run time). Both were NOT_STARTED.

## P4 authority P4-v7 → P4-v8 (`tools/gen_setcode_overlay.py`, regenerated `data/setcode_overlay_v4.json` / `data/03_setcode_overlay_v4.js`)
- `GROUP.GEM` 「ジェム」: every card whose name contains ジェム — 24 cards (the Gem-Knights, ジェムエレファント / タートル / レシス / ジェム・マーチャント / ジェム・エンハンス / ジェムフラッシュエナジー / カウンター・ジェム).
- `GROUP.GEMKNIGHT` 「ジェムナイト」: names containing ジェムナイト — 17 cards. The setcode 0x100f (20 cards) is not used: it also tags ジェム・エンハンス / 輝石融合 / パーティカル・フュージョン.
- GEM ⊃ GEMKNIGHT is intended (a ジェムナイト name contains ジェム). Counts: predicate 36→38, authority 486→510, overlay 340→364, total membership 491→532.
- `tools/test_p4_setcode_authority.js`: pinned counts updated. The 「複数groupに属するpasscodeは5件のみ」 pin encoded "no predicate nests another"; it now expects the 5 old ones plus the 17 GEMKNIGHT passcodes (each exactly `GEM`+`GEMKNIGHT`), and a new assertion checks GEMKNIGHT ⊂ GEM (17 / 24). This is a changed expectation of an existing test (the old fact "5" was true only before the nested group existed); flagged for review.

## Cards (`cards/HZZZZZT_claude_s03_u307_gem_duals.js`, `defineGeminiS03`)
- アイオーラ: once per turn, cost: banish a 「ジェム」 monster from my Graveyard; target: a different 「ジェムナイト」 card in my Graveyard → add to hand. The cost and the target must be two different cards (a lone ジェムナイト monster cannot be both).
- アンバー: once per turn, cost: send a 「ジェムナイト」 card from my hand to the Graveyard; target: my banished monster → return to hand.
- Adding / returning goes through `API.returnToHand` (Graveyard lock applies; a Fusion monster goes back to the Extra Deck — tested).
- NOT_STARTED → TESTED for both (declared in `data/s03_status_changes.json`). No known deviation.

## Tests
- `tools/test_s03_u307_gem_duals.js` 35 / 0, real DUEL path (Gemini Summon, activation, cost, target, resolution), Replay-audited; negative control on the previous build: 14 FAIL.
- `tools/test_p4_setcode_authority.js` 103 / 0.
- Coverage: TESTED 2927 → 2929, NOT_STARTED 920 → 918; audit 0 off-target.

## Not done
- The old per-unit pre-scan wrapper (`chain.sh`) was not available in the GitHub tree; the full gate (`check.py` stops at the first failing test) is the check.
