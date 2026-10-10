# Codex 4,996-card Autobuild Workflow

## Goal
Reach behavior coverage for every card in `data/carddata.json` without turning coverage count into a vanity metric. The project must prefer correct common rules and accurate historical 1103 behavior over fast card-count growth.

The database contains **4,996 cards** with a strict normal cutoff of **2011-08-31**. Some stored effect text may reflect later errata, so historical behavior must be verified when the difference matters.

## Coverage is the source of truth
Run:

```bash
python tools/script_coverage.py
```

Outputs:
- `data/script_coverage.json` — machine-readable status for all 4,996 cards.
- `docs/SCRIPT_COVERAGE.md` — summary counts.
- `docs/CARD_INDEX.md` can be refreshed with `python tools/index_cards.py`.

Statuses:
- `TESTED` — explicit local registration exists and the card name appears in regression tests. This is strong progress, not a guarantee that every ruling edge case is covered.
- `IMPLEMENTED` — explicit local registration exists but dedicated test coverage still needs strengthening.
- `GENERIC_OK` — no card-specific effect script is required because existing generic rules handle the card (for example, a Normal Monster or an effectless Synchro/Xyz recipe).
- `PARTIAL` — coarse/legacy automation exists, especially `AUTO_DECK_TABLE`, but it has not passed a card-specific historical accuracy review. **Never count PARTIAL as complete.**
- `ENGINE_GAP` — accurate implementation is blocked by a missing reusable engine primitive. The reason must name the missing primitive precisely.
- `NOT_STARTED` — no trustworthy implementation yet.
- `OUT_OF_SCOPE` — outside the configured historical cutoff.

Manual exceptions live in `data/script_status_overrides.json`. Remove/update an override when the engine gap is resolved.

## Automatic batch selection
Run:

```bash
python tools/autobuild_cycle.py --size 40
```

This refreshes coverage, selects a deterministic next batch, and writes:
- `data/next_script_batch.json`
- `docs/NEXT_SCRIPT_BATCH.md`
- `docs/CODEX_CURRENT_TASK.md`

The selector is only a **triage heuristic**. It prefers cards already present in project test decks and then lower static effect complexity. Codex must still inspect every selected card before coding it. A low complexity score is not a ruling.

## Mandatory Codex loop
After the initial v4.8 multi-attack checkpoint, repeat this loop autonomously:

1. Run `python tools/autobuild_cycle.py --size 40`.
2. Read `docs/CODEX_CURRENT_TASK.md`.
3. For every candidate:
   - verify the historical 1103 behavior;
   - inspect analogous local code;
   - identify reusable rule primitives;
   - implement with `defineUnifiedCardV4` where appropriate;
   - write focused positive and negative regression tests.
4. If several cards require the same missing behavior, implement one common engine primitive first.
5. If a card cannot be represented accurately, set it to `ENGINE_GAP` with a precise reason and continue. Do not fake the effect to keep the batch moving.
6. Run `python tools/check.py` and `python tools/build_acode.py data/carddata.json`.
7. Fix every regression before continuing.
8. Refresh coverage and create a checkpoint changelog/test report.
9. If git is available, commit the passing checkpoint. Do not initialize or rewrite repository history unless explicitly asked.
10. Continue to the next generated batch.

A batch can be 30–50 cards. Prefer smaller batches after an engine change and larger batches for simple effects that reuse already-tested primitives.

## ADS / EDOPro / Project Ignis reference policy
ADS-family implementations may be used as a **behavioral reference** for concepts such as:
- event/timing category;
- cost versus target versus resolution operation;
- reset/lifetime semantics;
- summon/effect restrictions;
- damage-step legality;
- edge-case interactions.

Do **not** copy Lua/C++ source, helper implementations, identifiers, or large source-derived structures into this project. Implement the behavior independently using this repository's own architecture. Prefer official Konami text/rulings when available. If external verification is unavailable and historical behavior is materially uncertain, mark `ENGINE_GAP` or a review note instead of guessing.

## Carddata.json policy
Do not modify `data/carddata.json` simply because a new script is added. Change it only for real metadata corrections such as missing/wrong `setcode`, `alias`, card identity, type, Attribute/Race, Level/Rank, or other database fields used by generic engine rules.

Any metadata change must have a regression test or a clear verification note.

## Quality gate
A card is not considered complete merely because its name appears in `defineScript`/`defineUnifiedCardV4`.

For each effect, cover relevant cases among:
- legal activation;
- illegal activation;
- cost payment and inability to pay;
- target selection and target loss;
- resolution-time choices;
- chain negation/effect negation;
- Damage Step timing;
- owner/controller routing;
- zone replacement;
- once-per-turn/count limits;
- summon provenance;
- End Phase/reset lifetime;
- Undo/Redo and Replay when persistent state is added.

The global gate remains:

```bash
python tools/build.py
python tools/check.py
python tools/build_acode.py data/carddata.json
```

No batch is complete with a failing regression.

## Completion target
The long-term finish condition is not "4,996 script names". It is:
- every in-scope card is `TESTED`, `IMPLEMENTED` with justified generic test coverage, or `GENERIC_OK`;
- `PARTIAL`, `ENGINE_GAP`, and `NOT_STARTED` are driven to zero or explicitly reviewed exceptions;
- all global tests pass;
- the single-file Acode build embeds all 4,996 cards;
- no copied ADS/EDOPro source exists in the repository.
