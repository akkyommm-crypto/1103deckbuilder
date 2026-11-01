# AGENTS.md — 1103 Duel ADS System

## GitHub migration override (2026-10-10)
- Current clean baseline is S03-U302, checkpoint SHA256 `a155a07610dc86b0f7a34a5bfe9b9f910565a2f2035b9396a393e96bc4d2d040`.
- Verified artifact `dist/battle.html` SHA256 is `b2f2a21b1080ee682c12656fdad4bc311d6299b600b134b888e1ffdc351ed6e7`; recorded gate is 18,178 PASS lines / 0 FAIL / `GATE_EXIT=0`.
- Current progress and resume state live under `coordination/`. Those files supersede the older v4.7 handoff numbers below without deleting the historical record.
- Repository-wide branch, worktree, scope, and completion rules are in the parent `AGENTS.md`.

## Mission
Build a stable, mostly automated Yu-Gi-Oh! one-player duel simulator for the historical "1103" card pool. The primary goal is that a duel can be played from start to finish without illegal actions, broken timing, replay divergence, or card-specific hacks leaking into the core engine.

## Historical rules / card pool
- Strict source cutoff for normal project work: **2011-08-31** unless a task explicitly says otherwise.
- Prefer the card text/rulings that were valid in the 1103 era when later errata changed behavior.
- `data/carddata.json` contains 4,996 cards and may contain modernized text. Do not blindly treat modern errata as the historical 1103 effect.
- Official Konami card text/rulings are the preferred external authority.
- ADS/EDOPro/Project Ignis may be used to understand behavior, timing categories, and edge cases, but **do not copy their Lua/C++ source code** into this repository. Implement independently with this project's APIs and architecture.

## Current checkpoint
- Baseline version: **v4.7.0**.
- `python tools/check.py`: **508 PASS / 0 FAIL** at handoff.
- Card DB: **4,996**.
- Explicit legacy `defineScript`: **299 unique**.
- Unified Effect: **57 unique**.
- Total explicit scripted card names: **356**.
- Replay format: v4.
- See `docs/CODEX_HANDOFF_V470.md` before changing code.

## Architecture
- `engine/00_state_actions.js`: serializable state transitions / `act()` action application.
- `engine/30_processor_chain_battle.js`: processor queue, chain/battle/damage-step flow, reserved effects.
- `engine/40_legal_script_engine.js`: legality checks and the public `API.*` used by card scripts.
- `engine/45_unified_effect_v4.js`: Unified Effect declaration/adapter (`condition -> cost -> target -> operation`).
- `engine/05_ads_architecture_core.js`: LOCATION, SETCODE, RESET, runtime effects/stat layers.
- `engine/06_replay_rng_v41.js` + `engine/08_replay_runner_v44.js`: deterministic RNG, Action Journal, replay audit/runner.
- `cards/*.js`: card-specific behavior. New work should normally use `defineUnifiedCardV4`.
- `data/carddata.json`: card metadata/database. Change only when metadata is actually missing/wrong; card script additions alone do not require DB changes.
- `build_manifest.json`: source concatenation order. Add new source files here.
- `dist/*`: generated output. **Never edit generated HTML directly.**

## Implementation rules
1. Prefer a reusable common rule/action/API over a card-name-specific engine patch when multiple cards need the behavior.
2. New Unified card effects should use `API.*`, `act()`, runtime effects, or documented common helpers. Do not directly mutate `gameState` inside a card effect unless there is no action/API path and the task explicitly adds one.
3. Any new persistent duel state must be JSON-serializable and replay-safe. Never store functions in `gameState`.
4. If an action changes gameplay state, include it in replay/state-digest coverage when necessary.
5. Respect cost/target/operation timing. Do not model a non-targeting resolution-time choice as an activation target merely because it is easier.
6. Respect Damage Step timing (`start`, `before`, `calc`, `after`, `leave`, `end`) rather than approximating all battle effects as one event.
7. Handle both attacker and defender cases when the real effect says "destroys a monster by battle" rather than "attacks and destroys".
8. Preserve owner/controller routing for graveyard, hand, Deck/Extra Deck returns, Xyz materials, and monster-as-Equip cards.
9. Do not rewrite large working subsystems just to add one card. Add a focused primitive and regression coverage.
10. Keep the user-facing Acode build as a single HTML with embedded DB.

## S03 conventions (Claude units S03-Uxxx)
- 1103 texts over later errata: the project `data/carddata.json` holds some modern texts. Implement the 2011 text and note the
  difference in the script comment. Example: クリッター / 黒き森のウィッチ carry the later 「1ターンに1度」 and 「このターン…発動できない」,
  and neither is in the 1103 effect.
- Deck recruiters / searchers triggered by 「このカードが戦闘によって破壊され墓地へ送られた時」 or 「このカードがフィールド上から墓地へ送られた時」:
  declare them with `declareDeckTriggerS03(name, spec)` (`engine/1ZT_deck_trigger_s03.js`); do not write a new script per card.
  - The spec covers when / action / from / filter / pos / optional / max / minPick / lpCost / extra / before.
  - The engine handles the self event, the resolution-time Deck choice, no candidate, the shuffle, zone / SS lock / ライオウ, and the Damage Step batch.
  - `deckTriggerHappenedS03(ctx, {when})` is the shared self-event test for scripts that need it inside a larger script (ゴブリンゾンビ ②).
- Battle protection: `battleProof()` reads the text only for the unconditional self sentence 「このカードは戦闘では破壊されない」
  (S03-U158). Declare anything conditional / once per turn / for other monsters with `protectV21` (engine/1K, System v21).
  The battle context passes `battleRole` ('attacker' / 'defender') to `protectV21.battle(target, src, ctx)` (S03-U161).
- 「○○」と名のついた: use the P4 overlay (`GROUP.*`, `isCardInGroupV4`, passcode only). If a group is missing, add it to
  `tools/gen_setcode_overlay.py`, regenerate, and bump the authority version and the pinned counts in `test_p4_setcode_authority.js`
  (S03-U161 GAERU → P4-v6). Never test names at run time.
- 「相手のカードの効果によってフィールド上から離れた場合、除外される」: declare `banishIfLeavesByOpponentEffectS03:true` on the script
  (S03-U162). The cause is the move action's P3 stamp — never the live P3_EFFECT_CONTEXT inside applyAction (it is not replayed).
- Cost selections (S03-U474): a cost is not a target. `API.selectCard` inside `cost(ctx,done)` (and the `selectTargets` of a `declareCostSelectionFirstS03` script) is a cost selection
  automatically (`engine/1ZZW_cost_selection_phase_s03.js`) — no `filterTargetable`, even when the script declares `targets:true`. A registered choice (`API.requestChoice` / `p11cOpen`)
  states its own kind: omit `targeting` for a cost (or `selection:'cost'`), `targeting:true` for a target. To override the automatic kind pass
  `API.selectCard(title, cands, onPick, note, {selection:'cost'|'effect'})` (e.g. a real target chosen inside a CSF `selectTargets`: `'effect'`). The kind is recorded as
  `pendingChoice.selection` and restored for the callback. Keep the cost's own restrictions (cannot be released etc.) in the candidate predicate.
- Synchro Summons in tests: take legal materials from `exCombos(p, db).combos` and summon with `beginExSummonV2`. `doExSummon` with
  hand-picked indexes used not to check the materials (S03-U162 found an illegal ゴヨウ・ガーディアン in the U156 test); since S03-U163
  `beginExSummonV2` refuses an illegal set (`exMaterialsLegalS03`).
- 「このカードと戦闘を行ったモンスター」: use `battledTogetherS03(a, b)` (both zone-local records written by the ATTACK action, S03-U160).
  「相手は…を攻撃対象に選択できない」: `continuous.cannotBeAttackTarget(target, src)` with `continuous.scope` (engine/1ZU).
- Field departures that happen together are one simultaneous batch: the battle cleanup's onLeaveField, and a drained run of
  leave-field events of 2+ cards, and — S03-U159 — the leave-field events of a summon's Tributes / materials together with the
  summon success that follows them (`engine/30` `leaveBatchRunS03`; the post-summon POINT is carried by `postPointS03`, also in the
  v11 data continuation). Test multi-card departures as one chain.
- Every unit: a real-path test (`tools/test_s03_uNNN_*.js`, fixed RNG seed, Replay audit), a negative control on the previous build,
  `CARD_TEST_FOCUS` in `tools/script_coverage.py`, and declared status changes (`data/s03_status_changes.json`). Never delete a failing
  test. Update an assertion only when it encoded behaviour that the 1103 text contradicts, and say so in its comment.

## Version / source conventions
- New checkpoint after v4.7 should be v4.8.0, then v4.9.0, etc.
- Prefer one new card batch source per checkpoint, e.g. `cards/48_v48_native.js`.
- Add the file to `build_manifest.json` before `cards/40_auto_interpreter.js` unless architecture requires another order.
- Update `systemVersion` and visible debug labels consistently at a checkpoint.
- Preserve old changelogs/test reports; create new ones for the new checkpoint.

## Required validation
Run after every meaningful engine change and before completing a checkpoint:

```bash
python tools/build.py
python tools/check.py
python tools/build_acode.py data/carddata.json
```

Also add a dedicated Node regression file for the checkpoint (pattern: `tools/test_v470_native_cards.js`) and invoke it from `tools/check.py`.

Acceptance for a checkpoint:
- all existing tests PASS;
- new dedicated tests PASS;
- JavaScript syntax PASS;
- zero duplicate top-level function declarations;
- Acode single-file build succeeds with 4,996-card embedded DB;
- no direct ADS/EDOPro source import/copy;
- changelog + test report updated.

## Working style
- First inspect existing helpers and analogous cards before adding new primitives.
- For a broad change, write a short implementation plan, then implement and test it.
- Keep each task scoped. Do not attempt to "finish all Yu-Gi-Oh rules" in one patch.
- If an effect cannot be modeled correctly with current primitives, document the missing primitive and implement the primitive first or defer the card. Do not fake the ruling.

## 4,996-card autobuild mode
For mass card implementation, `docs/CODEX_AUTOBUILD.md` is mandatory reading.

Before selecting card work, refresh coverage:

```bash
python tools/script_coverage.py
```

After the v4.8.0 multi-attack bootstrap checkpoint, create each next batch with:

```bash
python tools/autobuild_cycle.py --size 40
```

Rules:
- Coverage status, not raw script count, is the progress metric.
- `PARTIAL` is never complete.
- `ENGINE_GAP` is acceptable when accompanied by a precise reusable missing primitive; continue with other cards instead of faking behavior.
- `GENERIC_OK` is valid for cards that genuinely need no card-specific effect script because generic summon/battle rules fully describe them.
- Keep batches normally 30–50 cards, but shrink the batch when a new shared engine primitive is introduced.
- After every passing batch, regenerate coverage and the next task.
- If git is already configured, commit passing checkpoints; do not initialize/rewrite repository history unless the user asks.
