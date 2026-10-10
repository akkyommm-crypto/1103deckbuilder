# S03-U58 Resolution-time Deck choices (Codex)

Base: local U57 work tree, after attack-declaration context and redirect plumbing.

## Why this unit

Before selecting the Requirement, U58 measured five not-yet-covered major deck routes with 4 seeds and both first-player orders each, 40 duels total:

- 【Dragunity】 vs 【Dark】: 8 / 8 completed, 8 / 8 Replay OK. The only unsupported item was the known `未来融合－フューチャー・フュージョン` activation gap.
- 【Karakuri】 vs 【BF】: 8 / 8 completed, 8 / 8 Replay OK, no blockers or unsupported actions.
- 【Agent】 vs 【TG Skill Drain】: 8 / 8 completed, 8 / 8 Replay OK, no blockers or unsupported actions.
- 【HERO】 vs 【Six Samurai】: 8 / 8 completed, 8 / 8 Replay OK, no blockers or unsupported actions.
- 【Jurrac】 vs 【Worm】: 8 / 8 completed, 8 / 8 Replay OK, no blockers or unsupported actions.

The highest-value common Requirement selected from the queue was the legacy pattern where non-target Deck cards asked for the Deck card at activation time. That made cards such as `増援`, `テラ・フォーミング`, `おろかな埋葬`, and `ワン・フォー・ワン` observe an old Deck state, created unfinished-activation save/load behavior for choices that are actually resolution choices, and diverged from the existing resolution-time pattern already used by `強欲で謙虚な壺`.

## Closure

- Added serializable U58 choice handlers:
  - `s03u58.deck-search`
  - `s03u58.deck-mill`
  - `s03u58.deck-special`
- `増援` no longer asks for the Warrior at activation. It creates the chain link first, re-checks the `ライオウ` Deck-to-hand lock at resolution, then asks for the current Deck candidate.
- `テラ・フォーミング` no longer asks for the Field Spell at activation. It re-checks the `ライオウ` lock at resolution, then asks for the current Deck candidate.
- `おろかな埋葬` no longer selects the Deck monster at activation. It asks for the current monster in the Deck at resolution and mills that card.
- `ワン・フォー・ワン` keeps only the discard as its activation-time cost choice. The Level 1 monster is selected from the current Deck at resolution and Special Summoned then.
- Updated interrupted-activation SaveLoad tests so completed post-U58 chain links resume as chain/resolution work instead of being rolled back as unfinished activation choices.
- Added `tools/test_s03_u58_resolution_deck_choice.js` and wired it into `tools/check.py`.
- Promoted `おろかな埋葬` and `ワン・フォー・ワン` from IMPLEMENTED to TESTED through U58 evidence. `増援` and `テラ・フォーミング` were already TESTED by U01 coverage.

## Gate Hygiene

The first U58 Full Gate returned exit 0 but exposed two swallowed `ReferenceError` lines in older auto-cycle tests. U58 fixed those before publication:

- `cards/B4_auto_cycle12.js`: added the missing attribute helper and allowed `復活の墓穴` to enforce its position lock from both `sz` and `grave` contexts used by the tests.
- `tools/test_auto_cycle12.js`: made VM exceptions fail the process, fixed the `エレメント・デビル` fixture to use a real Earth presence and effect monster victim, and made the direct `復活の墓穴` fixture face-up.
- `tools/test_auto_cycle18.js`: replaced a raw `isEffectNegated` call with `API.isEffectNegated(...)` and made VM exceptions fail the process.

## Dedicated Test

`node tools/test_s03_u58_resolution_deck_choice.js` -- EXIT 0.

Covered:

- `増援`, `テラ・フォーミング`, `おろかな埋葬`, and `ワン・フォー・ワン` create a chain link without an activation-time Deck choice.
- After a pre-resolution Deck change, the resolution choice lists the current Deck candidates, not the activation-time candidates.
- `増援` and `テラ・フォーミング` still respect `ライオウ` if the lock is restored before their link resolves.
- `ワン・フォー・ワン` pays the discard before resolving, then chooses and Special Summons the remaining Level 1 monster from the Deck.
- Save/load and Replay reproduce the resolution choice state.

## Gate

- `python tools/check.py` -- EXIT 0, 12864 PASS / 0 FAIL.
- Full Gate log search found no `ReferenceError`, `FAIL`, `Traceback`, or `Error:` lines. Log: `s03_u58_full_gate_2.log`.
- `python tools/script_coverage.py`:
  - TESTED 2093
  - ENGINE_GAP 613
  - NOT_STARTED 1300
  - IMPLEMENTED 170
  - GENERIC_OK 644
  - PARTIAL 176
  - TOTAL 4996
- `python tools/s03_status_audit.py` -- EXIT 0:
  - declared status changes observed: 44
  - off-target status changes: 0
  - promoted cards keep card registrations
  - promoted cards seen by declared tests
  - TOTAL 4996
- `python tools/build_acode.py data/carddata.json` -- EXIT 0, cards=4996:
  - raw `dist/battle.html` SHA256 `ac34e8ee6dd9ac507c2fab65f951f03934653291aa3a4c7764951d495da24b69`
  - raw `dist/battle_acode.html` SHA256 `3c42039a16c1ab3cea8e373541830d581db887e33f1cc13e7fb2a82e111f4a7e`

## Source Hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, and this report set aside): `d6f6dc9301642242c6ac5437dbfe6727609e039b4020959b31311bec5ea84b91` (755 files).

## Remaining

- U58 closes the representative non-target Deck choice timing gap for common search, mill, and Deck Special Summon patterns.
- Continue measurement-first major fixed-list/preset routes and pick the highest-value shared Requirement from the first fresh blocker, replay divergence, unsupported action, or repeated manual-only pattern.
