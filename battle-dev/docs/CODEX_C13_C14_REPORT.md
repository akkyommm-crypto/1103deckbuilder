# CODEX-C13/C14 — Rabbit Laggia sample and Skill Successor

Base: published `main` at `34ecebc` on the isolated `codex/rabbit-laggia` branch. Claude's worktree and branch were not edited.

## C13: user-supplied Rabbit Laggia recipe

- Replaced the opponent sample with the exact requested Main 40 and Extra 15.
- Added the requested Side 15 as deck metadata. Side cards are preserved across normal sample starts, selected-deck starts, save data and Replay actions, but are not mixed into the playable Deck, hand, or Extra Deck.
- Strict sample validation now checks the Side Deck's 15-card maximum and the combined same-name limit across Main, Extra, and Side.
- Updated four deterministic vertical-slice openings to use `禁じられた聖槍`, which is present in the new list, instead of the removed `エフェクト・ヴェーラー`; two older helpers now fail explicitly if a requested opening card is absent.

## C14: スキル・サクセサー

- Implemented the Set Trap effect: target one own face-up monster and give it +400 ATK until the End Phase.
- Implemented the Graveyard Trap effect: only during its owner's turn and not on the turn sent to the GY; banish itself as activation cost, then target one own face-up monster and give it +800 ATK until the End Phase.
- The supplied Rabbit Laggia Main/Extra/Side list now has no `NOT_STARTED` card in the generated coverage report.

## Validation

- Both new dedicated tests were first run against the previous generated build and failed, establishing negative controls.
- `tools/test_codex_c13_rabbit_laggia_recipe.js` checks exact 40/15/15 multisets, strict-1103 legality, side metadata isolation/preservation, normal opponent start, and Replay equality.
- `tools/test_codex_c14_skill_successor.js` checks both effects, cost timing, expiry, own-turn/sent-turn restrictions, target filtering, and Replay equality.
- Existing Rabbit opponent start, selected-deck start, lifecycle Replay, and VS1–VS5 vertical slices are retained as regression coverage.
