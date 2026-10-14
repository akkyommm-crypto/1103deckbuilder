# CODEX-C09 — supplied-deck priority automation, final card

Base: pushed CODEX-C08 (`2f14b86`) on the isolated `codex/deck-priority-1` branch. Claude's worktree and branch were not edited.

## Scope and result

`光と闇の竜`, used twice in the supplied レヴァライダー main deck, moved from `NOT_STARTED` to `TESTED`.

All 96 unique cards in the three supplied lists are now covered: 95 `TESTED` and 1 `GENERIC_OK`. No supplied-list card remains `PARTIAL`, `ENGINE_GAP`, or `NOT_STARTED`.

## Implementation

- Added the mandatory once-per-chain response to effect-monster activations and Spell/Trap **Card** activations. Resolution rechecks face-up presence, battle-destruction state, and both current ATK/DEF; a successful activation negation does not destroy and applies a persistent 500/500 reduction that resets when the card leaves, turns face-down, or is disabled.
- Added a multi-Attribute query while preserving the existing scalar Attribute API. A face-up `光と闇の竜` is both LIGHT and DARK; face-down or outside the Monster Zone it is only its printed LIGHT Attribute.
- Added the mandatory destroyed-to-GY trigger from the field, hand, or Deck. It targets when a summonable monster exists, destroys all cards in all three own field zones, and then revives the still-valid target. It still resolves safely with no target, no field cards, or a target that left the GY.
- Preserved the existing generic `cannotSpecialSummon` restriction.
- Corrected the supplied-deck card `D.D.クロウ`: discarding is now an activation cost, so it remains paid when the activation is negated.

## Validation

- Official Konami card details and the 24-entry official Q&A were checked before implementation. The Q&A explicitly covers the once-per-chain rule, the resolution-time 500/500 check, reset on disable/face-down/leave, no destruction on negation, and the destroyed trigger from hand/Deck.
- Negative control on CODEX-C08 failed the new registration, activation-negation, dual-Attribute, Special Summon restriction, and destroyed-trigger assertions before implementation.
- `tools/test_codex_c09_light_and_darkness_dragon.js` covers real DUEL Spell and hand-monster activations, paid cost, low-stat failure, Spell-effect/card-activation distinction, once per chain, dual Attribute, Special Summon restriction, field/hand/Deck destruction, full own-field wipe, empty/missing targets, revival, and eight Replay audits.
- Nearby activation-response, forced-response, negation, characteristic, and negated-card-settlement suites pass.
- Full repository gate is run before commit.
