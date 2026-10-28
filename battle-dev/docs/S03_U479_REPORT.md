# S03-U479 — P1.1 target-source propagation

Base: `7f4b2dc9` (`codex/battle-u479-p11`). Requirement: a P1.1 activation-time target choice opens after `endActivationPrepS03()`, so `requestChoiceV49()` previously filtered with no activated-card source. This made `targetCount` unavailable to source-aware immunity such as Metal Silver Armor.

## Change

- `requestChoiceV49()` now uses explicit `spec.effectInfo` unchanged when supplied. Otherwise, for a targeting card choice with `meta.scriptName`, it reconstructs source details with `targetEffectSourceS03(targetingPlayer, {name: scriptName, v4EffectKey})` before `filterTargetable`.
- This uses `targetingPlayer` for the effect source; `spec.player` remains the player answering the choice. It does not infer a target count from `min` or `max`.
- Cost selections remain non-targeting because the existing `selection:'cost'` path sets `targeting` false before this branch.
- Removed the card-local prefilter workaround from `ガスタのつむじ風`; it now declares its actual target choice with `targeting:true` and exercises the central path.
- Added the missing `targeting:true` choice flags for `幻惑の巻物` and `異次元への隙間` in their actual defining files. No blanket claim about the remaining P1.1 sites is made.

## Validation

- Dedicated `node tools/test_s03_u479_p11_target_source.js`: central ガスタ source propagation + multi-target Armor, 幻惑の巻物 / 異次元への隙間 target immunity and normal chains, explicit effectInfo precedence, chooser/effect-player separation, cost selection, Save/Load and Replay. Wired into `tools/check.py` and `CARD_TEST_FOCUS`.
- The delegate first generated `dist/battle.html` with equivalent manifest concatenation because its shell could not resolve Python. Sol then ran the canonical bundled Python `tools/build.py`: exit 0, identical SHA-256 `b065b63fc875e9eb498bb1392bbd402240c7c05acadbaba77b224a07e087ceb9`.
- `node tools/test_s03_u478_two_target_cards.js`: exit 0, 156 PASS, 0 FAIL. This drives the real ガスタ chain with the central filter: multi-target Metal Silver Armor exception, a separate immunity source, single-target Armor control, Replay, and Save/Load all pass.
- `node tools/test_p11_activation_cards.js`: exit 0, 80 PASS, 0 FAIL. `node tools/test_p11_activation_context.js`: exit 0, 32 PASS, 0 FAIL.
- `node tools/test_s03_u263_declare_commit.js`: exit 0, 8 PASS, 0 FAIL (幻惑の巻物 real chain and Replay).
- `node tools/test_s03_u375_traps2.js`: exit 0, 27 PASS, 0 FAIL (異次元への隙間 real chain and Replay).
- New wired `tools/test_s03_u479_p11_target_source.js`: exit 0, 13 PASS, 0 FAIL. It directly pins the central `meta.scriptName` path, ガスタ under the Armor, per-card target-immunity behavior and normal resolution for 幻惑の巻物 / 異次元への隙間, explicit `effectInfo` precedence, `targetingPlayer` distinct from the chooser, cost-selection bypass, saved pending-choice metadata, and Replay.
- Mutation controls: temporarily removing only the P1.1 source propagation made U478 fail 18 assertions and the dedicated test fail 1 assertion. Removing only the two new `targeting:true` flags made the dedicated test fail 2 assertions. All mutations were restored.

## Batch completion contract

- U479 is committed only through the U479-U481 `finish-work.ps1` path, which creates the candidate commit after the serial full gate exits 0. Exact PASS count and pushed SHA are reported by that command; GitHub Actions remains required for the exact SHA before integration or publication.
