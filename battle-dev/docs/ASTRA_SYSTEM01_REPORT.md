# Astra System 01 — clean checkpoint report

Scope frozen by user: the existing generic grave-to-equip work and five specified cards only. System02 was not started. Artifact filename retains the user's requested 20260909 date; completion is 2026-09-10 JST.

## Validation

| Metric | Cycle66 | System01 |
|---|---:|---:|
| Full Gate PASS | 11269 | 11407 |
| Full Gate FAIL | 0 | 0 |
| TESTED | 2042 | 2047 |
| ENGINE_GAP | 620 | 617 |
| NOT_STARTED | 1310 | 1308 |
| IMPLEMENTED | 198 | 198 |
| GENERIC_OK | 644 | 644 |
| PARTIAL | 182 | 182 |
| Card pool | 4996 | 4996 |
| Static registered names | 2240 | 2245 |

`tools/check.py` exited 0. Baseline was verified before editing. Engine-only Gate: 11324 PASS / 0 FAIL, before card recovery. Final Gate includes 57 primitive tests, 76 real-card tests and five scope/coverage assertions. It retains every historical test suite. Two caught ReferenceError diagnostics are byte-equivalent to baseline (`c1ElementOnField`, `isEffectNegated`); they are recorded as out-of-scope legacy diagnostics, not hidden or described as newly fixed. New dedicated tests have no such diagnostics.

## Cards unlocked

| Card | Before | After | Evidence |
|---|---|---|---|
| ドラグニティ－ドゥクス | ENGINE_GAP | TESTED | Real normal summon → optional SEGOC → saved target choice → chain resolution → equip; field count; source control transfer; target/source/full-zone/negation negatives |
| ザ・キックマン | ENGINE_GAP | TESTED | Real Reborn activation/resolution produces Special Summon trigger; legal Equip Spell recovered without Spell activation; non-equip/no-space/no-pool negatives |
| トラックロイド | ENGINE_GAP | TESTED | Real attacking and defending battle paths; mandatory non-targeting absorption; full-zone resolution; mutual destruction excluded; original owner; continuous ATK/negation |
| 凶悪犯－チョップマン | NOT_STARTED | TESTED | Real Flip Summon trigger, equip and ATK; battle flip excluded; no-pool/non-equip/full-zone negatives |
| ドラグニティ－レギオン | NOT_STARTED | TESTED | Normal-summon equip and separate ignition cost/target/destruction; paid cost persists on negation; face-down target excluded; branch categories |

Vajrayana remains NOT_STARTED with no partial registration. The existing Phalanx and Gae Bulg were not promoted; Dux → Phalanx → Gae Bulg was exercised through UI summon/activation functions and actual processors, with a nonempty 32-action Replay audit. A complete Dragunity/REDMD deck is not claimed; no user-specific deck list was supplied.

## Change scope

engine files changed:

- `engine/00_state_actions.js`
- `engine/06_replay_rng_v41.js`
- `engine/10_activation_choice_v11.js`
- `engine/1N_grave_equip_v31.js`
- `engine/1O_activation_event_continuation_v11.js`
- `engine/30_processor_chain_battle.js`
- `engine/40_legal_script_engine.js`

card files changed:

- `cards/F9_astra_system01.js`

tests added:

- `tools/test_astra01_primitive.js` (57 PASS)
- `tools/test_astra01_cards.js` (76 PASS)
- `tools/astra01_status_audit.py` (five assertions; wired into Full Gate)
- Shared test-only harness `tools/astra_harness.js`; pre-change/trigger probes retained separately.

`build_manifest.json` includes the two generic modules and one card module. `tools/check.py` runs dedicated tests and the scope audit. The Cycle09 historical absence assertion was preserved under the old-engine branch; its original byte-exact file is in `docs/history/`. No other existing test was changed. Raiou's regression file, the original card database, and Acode output are byte-identical to Cycle66. Acode was not rebuilt.

## State and lifecycle verification

| Check | Result | Evidence boundary |
|---|---|---|
| Replay | PASS | Per-action and final digest, nonempty real-duel histories for all five cards |
| Undo | PASS | Exact pre-attachment digest restored |
| Redo | PASS | Exact post-attachment digest restored |
| SaveLoad | PASS | JSON equipment links, retained Journal package, pending registry choice and committed chain; legacy callbacks/globals cleared before continuation |
| Journal | PASS | Atomic equipment move; explicit queue add/pop and event resume; Replay does not rerun operations |
| digest | PASS | Source UID/links/continuation represented; intentionally altered source provenance is rejected |
| Lifecycle | PASS | Owner/controller separation, control change, face-down, grave/bounce/banish of either endpoint, detach and subsequent summon, source negation |
| Off-target status changes | 0 | Frozen 4996-card baseline compared with regenerated coverage |
| Registration misses | 0 | All five registered from real card source |
| Fixture false positives | 0 | Five exact status changes; no tool/fixture registrations |

The primitive reuses v15/v46 equipment links. P1.1's continuation and external deferred event queue mutations had to be connected to existing processor/Journal boundaries for real play; the initial primitive-only Gate did not expose those paths. These amendments are part of System01, not a separate system rollout.

## Rules/source discipline

The 2011-08-31 card pool and 2011-format source database are unchanged. No modern errata text was imported. Existing printed descriptions were compared with official card pages; later FAQ dates are supplementary ruling evidence, not a changed format definition.

- [Dux official card](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=8388&ope=2&request_locale=ja)
- [The Kick Man official card](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=5957&ope=2&request_locale=ja)
- [Chopman official card](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=5820&ope=2&request_locale=ja)
- [Truckroid official FAQ](https://www.db.yugioh-card.com/yugiohdb/faq_search.action?cid=6743&ope=4&request_locale=ja): non-targeting mandatory absorption, no mutual-destruction trigger; 2015 supplemental entry, unchanged card text.
- [Legionnaire official card](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=8389&ope=2&request_locale=ja)

## Checkpoint

Name: `checkpoint_astra_system_01_live_20260909.zip`. The external `LATEST.md`, `CHECKPOINT_METADATA.json` and delivered report record final SHA256, size, file count and testzip result after ZIP creation. They are kept outside the archive to avoid self-referential hashes.

Cycle66 source SHA256: `83a5ceba6a66c6f3cd7afb6946a4a45311018bc67d70aa5cd834faa3dea8e034`; size 4525424; file count 538; testzip OK. The previous checkpoint is preserved. Full logs, frozen coverage audit, baseline gap classification, design, changed-file manifest and follow-up list are included in this archive.

No new ENGINE_GAP analysis or surrounding bug hunt was started after scope freeze. Remaining findings are recorded in `FOLLOW_UP_GAPS.md`. Stop at this checkpoint as requested.
