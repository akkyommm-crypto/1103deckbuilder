# S03-U481 — resolution-time non-target choices

Base: `7f4b2dc9`; candidate branch: `codex/battle-u479-p11`. This unit moves the card selection for E・HERO エアーマン and ダスト・シュート from activation to resolution and keeps both selections non-targeting.

## Ruling scope

- The archived `WIKI-5439C489E1022010` Airman entry (2010-09-13) says the destruction is uncertain at activation. That is consistent with a resolution-time choice, but is not a direct period Q&A stating the complete targeting rule.
- Current official card entry `cid=6784` corroborates that Airman has no activation target. It is modern corroboration only. The adopted behavior still requires choosing at least one Spell/Trap when the destroy mode can apply; zero is not introduced as a UI convenience.
- Current official card entry `cid=5446` (2014 wording) explicitly treats Dustshoot's hand selection as non-targeting. It corroborates the implementation, but is not presented as a direct 2011 FAQ.

## Change

- Airman fixes only search/destroy mode at activation. On destroy-mode resolution it re-reads the current number of other HERO monsters and the current Spell/Trap cards, then opens a required `min:1` non-targeting choice up to that current limit. If responses leave no capacity or no candidates, it resolves without a choice.
- Dustshoot creates a targetless chain link, reveals the current hand only at resolution, and then opens a required non-targeting choice among the monsters still in that hand. If responses leave no monster, it resolves safely without a choice.
- Both pending resolution choices use registered, JSON-safe handlers with uid-based live-card lookup, so Save/Load and stale response-state changes do not depend on serialized functions or stale array indexes.

## Validation

- Canonical bundled-Python `tools/build.py`: exit 0; builder content SHA-256 `c7519483d6ce562c7e4a428afe8719532fa4661a4a79977cd2fb2d35952c38a4`; Windows on-disk artifact SHA-256 `e4fca453f2dbb1f9bd7fb3cc6abeca29b27c59a1ad0a4410a8615b365505ad0d`.
- New wired `tools/test_s03_u481_resolution_non_target.js`: exit 0, 23 PASS / 0 FAIL. It covers real activation/chain flow, response-time board and hand changes, reveal timing, no-monster/no-Spell-Trap branches, required Airman minimum, multi-destroy, stale candidates, Save/Load, Replay, and JSON-safe resumes.
- Nearby compatibility: U01 (ライオウ/Airman) exit 0; U90 (Dustshoot) 9/0; U63 trigger/search coverage 23/0; U476 selection-target audit exit 0 with the exact 34-card classified remainder and only Snow left open.
- Negative mutation 1: changing Airman's resolution choice from `min:1` to `min:0` gives dedicated exit 1 / exactly 1 FAIL.
- Negative mutation 2: adding `targeting:true` to both resolution choices gives dedicated exit 1 / exactly 3 FAIL (two Airman path assertions and one Dustshoot assertion). Both mutations were restored and the dedicated test returned to 23/0.

## Batch completion contract

- U481 is committed only through the U479-U481 `finish-work.ps1` path, which creates the candidate commit after the serial full gate exits 0. Exact PASS count and pushed SHA are reported by that command. No main integration or site publication is included, and GitHub Actions remains required for the exact SHA.
