# 1103 Duel Architecture

## Rule
- `dist/battle.html` is generated. Do not edit it directly.
- Edit source files under `engine/`, `cards/`, `runtime/`, `data/`, `ui/`, `styles/`.
- Run `python tools/build.py` to produce the single-file distribution.
- Source files are concatenated in `build_manifest.json` order to preserve legacy initialization order.

## Main areas
- `engine/`: game state, actions, Processor Queue, Chain/Event/Summon/Battle/Damage systems.
- `cards/`: card-specific scripts only. Shared rule behavior must move to `engine/`.
- `runtime/`: autosave, user actions, boot sequence.
- `data/`: 1103 test decks and fixed reproduction presets.
- `ui/`: render/input HTML shell.
- `tests/`: regression tests.

## Bug-fix rule
1. Reproduce with a deterministic preset/test.
2. Decide whether it is an engine bug or a card-script bug.
3. Fix the shared engine when multiple cards share the rule.
4. Add a regression test before release.


## v4.0 ADS Architecture Layer

### Metadata
`carddata.json` carries explicit `setcode` and optional `alias`. New scripts must prefer `isSetCardV4()` over card-name substring matching. `canonicalCardCodeV4()` is the canonical identity for rule-level same-name checks.

### LOCATION
Zones are represented by bit masks (`LOCATION.DECK/HAND/MZONE/SZONE/GRAVE/REMOVED/EXTRA/FIELD/OVERLAY`). Effect range and target range use the same vocabulary.

### RESET
Runtime effect lifetime is independent from ATK/DEF calculation order. `gameState.runtimeEffects` contains JSON-only data, while behavior remains in code. Supported v1 reset axes include LEAVE, TO_GRAVE, TURN_SET, SELF_TURN, OPPO_TURN, END, DISABLE and PHASE.

### Unified Effect
New effect objects use one shape: `type`, `range`, `targetRange`, `condition`, `cost`, `target`, `operation`. Activation is structurally ordered as condition -> cost -> target, while operation runs only at resolution. `v4EffectKey` is stored on the chain link so the exact effect survives source movement.

`legacyScriptToEffectsV4()` provides a read-only adapter. Existing scripts are not rewritten in v4.0.

### Replay prerequisite
A complete input-log replay is intentionally deferred until remaining legacy direct state mutations are migrated behind `act()` / Processor actions. Recording raw `act()` calls today would not be sufficient for every old card.


## v4.4 Replay Runner

Replay format 4 stores a JSON-safe initial game-state snapshot outside the Undo history and records committed Actions in the external journal. Each entry stores `seq`, `rngBefore`, post-action RNG state and a gameplay State Digest.

Playback applies the recorded Action directly through `applyAction()`, restores `rngBefore` before each action, then verifies both RNG and State Digest. Replay preview never writes autosave and blocks normal `act()` input. A replay position can be adopted as a new branch by keeping only the exact journal prefix.

Activation commitment is replay-safe: `CHAIN_ADD` carries count-limit consumption and the pending state for Continuous/Field/Equip activations. `CHAIN_RESOLVE_TOP` clears or preserves activation-negated state. This keeps activation bookkeeping in the same Action boundary instead of mutating state before/after the journal entry.

The digest validates not only card placement but also primitive per-card flags plus counters/modifiers, grave/banish metadata and chain target/negation data. UI-only priority-sheet state is not treated as authoritative replay state.

Truncated journals (`>2000` retained entries) are marked explicitly and are not accepted as complete from-start replays.
