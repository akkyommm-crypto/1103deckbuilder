# S03-U01 ライオウ Deck-to-Hand Lock (Claude)

Base: `checkpoint_codex_system_02_live_20260910.zip`
SHA256 `6917ca9499abb77f9894334cfbcf870f79585f610b9fd8cd53abf2e8ee0abe40`.

## Finding

ライオウ has a continuous effect: 「お互いにドロー以外の方法でデッキからカードを手札に加える事はできない」. Before this unit it was not implemented anywhere:

- `FX_SEARCH` and `FX_DECK_TO_HAND` had no guard.
- The ライオウ script only held the summon negation.
- Its TESTED status came from its name appearing in test files.

Impact on the provisional decks: the 兎ラギア deck runs ライオウ ×3. The standard test deck includes 増援 and E・HERO エアーマン.

Classification: ENGINE_MISSING. It sits between a missing producer and consumers that were never connected.

## Contract (C-S03-01 DECK_TO_HAND_LOCK)

- **Producer:** `continuous.lockDeckToHand(p, src)`, currently on ライオウ.
- **Source validity:** `continuousSources()` decides it (face-up, not negated, スキルドレイン). No new state is stored.
- **Query:** `deckToHandLockReasonV32(p)`.
- **Resolution consumers:**
  - `API.searchDeck` and `API.deckToHand` emit no Action while locked, so the journal stays consistent.
  - The legacy `runAutoEffect` search op is gated too.
- **Activation consumer:** `strictScriptLegalityV2` checks the script flag `blocksIfNoDeckToHand`. Hand actions and chain response lists inherit it.
- **Card-specific handling:**
  - 強欲で謙虚な壺: if the lock is active at resolution, the chosen card goes to GY and the rest are shuffled.
  - E・HERO エアーマン: the search mode is not offered while locked.
- **Not gated by design:** MANUAL-mode free manipulation tools.

## Historical basis

- 1103裁定DB R1103-RAIOH-004 (historical_source_confirmed):
  - Optional effects that must add from the Deck cannot be activated.
  - Mandatory effects activate but do not add.
  - Draws are allowed.
  - 封印の黄金櫃 can still be activated.
- R1103-RAIOH-005: スキルドレイン negates the lock.
- 2011 wiki snapshots:
  - ガジャルグ cannot be activated (09/07/05).
  - If ライオウ arrives in chain, neither the search nor the discard applies (09/08/29).
  - ラヴァルバル・ドラグーン behaves the same (11/05/10).
  - 栄誉の贄 cannot be activated (10/09/07).
- KONAMI current Q&A on 1103-era card pairs:
  - 増援 and テラ・フォーミング cannot be activated.
  - 強欲で謙虚な壺 cannot be activated. If ライオウ arrives in chain, the chosen card is sent to GY and the other two are shuffled back.
- The E・HERO エアーマン mode restriction is an inference: a mode whose resolution cannot add is not offered. No direct 2011 Q&A was found.

## Changed files

- engine: `engine/40_legal_script_engine.js`, `engine/30_processor_chain_battle.js`, `engine/20_effect_primitives_ex.js`
- cards: `cards/00_generic_core.js` (ライオウ, 増援, 強欲で謙虚な壺, E・HERO エアーマン), `cards/10_themes_a.js` (テラ・フォーミング), `cards/36_1103_expansion_v340.js` (紫炎の狼煙)
- tests / audit:
  - `tools/test_s03_u01_raioh_lock.js`
  - `tools/s03_status_audit.py`
  - `tools/astra02_status_audit.py` (`--coverage`)
  - `tools/check.py`
  - `data/s03_status_changes.json`
  - `data/system02_final_coverage.json` (frozen System02 coverage)
  - `data/s03_status_audit.json`
- generated: `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`, `dist/battle.html`, `dist/battle_acode.html`

## Verification

- **`node tools/test_s03_u01_raioh_lock.js`:** EXIT 0, 56 PASS. It covers:
  - real hand activation, choices, chain and resolution;
  - opponent and own ライオウ, face-down ライオウ, and スキルドレイン;
  - the lock restored mid-chain (a chained サイクロン destroys スキルドレイン before 増援 resolves);
  - 強欲で謙虚な壺 through its normal, illegal and chain-GY branches;
  - テラ・フォーミング and 紫炎の狼煙;
  - エアーマン's destroy-only path under the lock;
  - クリッター's mandatory trigger after battle destruction;
  - a draw under the lock;
  - Undo, Redo and a new branch after Undo;
  - a mid-chain save continued in a second VM, where the digest matches VM1 and the Replay audit passes;
  - a Replay audit on every scenario.
- **`python tools/check.py`:** EXIT 0, 11519 PASS / 0 FAIL (log `s03_u01_full_gate.log`).
- **`python tools/build_acode.py data/carddata.json`:** EXIT 0, cards=4996.
- **Coverage:** TESTED 2049 → 2052 and IMPLEMENTED 198 → 195 (増援, テラ・フォーミング, 強欲で謙虚な壺). Off-target status changes: 0. ENGINE_GAP 616 and NOT_STARTED 1307 are unchanged.
- **Gated source manifest SHA256** (excluding dist/ and *.log): `3b68f321c863b840f78b3d2d18f531d5ccc7e44c45141f6476812e17bcbd033e`.

## KPI

- Closed requirement: the lock is now enforced on the ライオウ card that the 兎ラギア deck runs ×3, which removes illegal searches in that matchup.
- This unit was not a full-duel completion test, and it unlocked no ENGINE_GAP cards.
- New gap found and closed in the same unit: 1 (the ライオウ lock).

## Unresolved

- Optional pure-search scripts not yet flagged (WORK_QUEUE Q2). They are still blocked at resolution, but they can be activated.
- 強欲で謙虚な壺 still reveals at activation instead of at resolution. This was pre-existing and is unchanged.
- The 収縮-style recalculation interactions are untouched.
