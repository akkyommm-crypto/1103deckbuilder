# S03-U59 未来融合－フューチャー・フュージョン (Claude)

Base: shared LATEST `checkpoint_codex_s03_u58_resolution_deck_choice_20260916.zip` (Codex, U58).

## Why this unit

The user's instruction named this card directly: it is the only entry in `data/r1_lists/known_gaps_v1.json` (the one tolerated real-duel gap on Astra's fixed lists), it has stayed unsupported since S03-U42, and a prior writer left an open design consult (`logs/S03_DESIGN_CONSULT_FUTURE_FUSION_TIMING.md`, 2026-09-13) asking Astra to resolve its 2011 material/summon timing. It is the mill engine for the fixed 【Dragunity】 list's `F・G・D` line.

## 2011 sourcing (before writing any code)

- `data/carddata.json`'s own `e0` field for this card already carries the pre-errata text (a pre-existing DB convention for errata'd cards, used elsewhere to widen generic keyword matching). Independently fetched the live yugioh-wiki.net page for 《未来融合－フューチャー・フュージョン》 (2026-09-17; the wiki uses EUC-JP percent-encoded page names wrapped in `《》`, not UTF-8) — the quoted pre-errata text matches `e0` verbatim.
- The wiki page's own commentary (not its scripted card text) states the errata boundary is 2016-12-17, and every FAQ entry dated on or before that boundary reflects the pre-errata card. Only entries dated ≤ 2011-08-31 were used here: 08/11/02 (剣闘獣ガイザレス-style restricted fusions cannot be designated), 11/06/08 (legal to activate even with a full Monster Zone), 10/01/28 and 10/07/16 (虚無魔人/マジック・キャンセラー block the delayed Special Summon; the card then sits doing nothing), and a second 10/07/16 entry (Deck materials only count as "used as Fusion Material" once the Fusion Summon actually succeeds).
- Two facts settle the design consult's open questions directly, from the page's own prose:
  - "旧テキスト時代は、カードの発動の効果処理時に即座に融合素材を墓地へ送っていた" — materials are sent to the GY on the card's own activation resolution, immediately, in one step. The "1st own Standby Phase" split is the errata; it does not exist pre-errata.
  - "現在の(2)に相当する効果はチェーンブロックを作らない裁定であった" — the 2nd-own-Standby-Phase Special Summon creates **no chain block** in this era.
- `F・G・D` (TESTED, `cards/G5_auto_cycle63.js`) is the fixed Dragunity list's target: material line `ドラゴン族モンスター×5`, already generic-parseable.

## Implementation

New `cards/HF_claude_s03_u59_future_fusion.js`. Reused existing capability throughout, no new engine primitives:

- `engine/20_effect_primitives_ex.js` `parseMaterialSpec` / `findMaterialCombos` / `slotMatches`, pointed at the Deck instead of the Field. For a single-slot spec (F・G・D's shape) the player gets a real choice — every qualifying Deck monster is offered and exactly `count.min` must be picked — rather than an arbitrary auto-pick; a multi-slot named-material spec (e.g. `A＋B`) falls back to the existing combo-auto-pick already used by ミラクル・フュージョン/超融合.
- U58's resolution-choice pattern (`API.requestChoice` + a named `registerChoiceHandler`) for both "which Extra Deck monster" and "which N Deck monsters," so the choices are SaveLoad-safe the same way `増援`/`テラ・フォーミング`/`おろかな埋葬` already are.
- `engine/16_scheduler_v7.js` `API.schedule({at:'standbyPhase', turns: turnsUntilOwnTurnV7(...)+2, ...})` for the 2nd-own-Standby-Phase Special Summon — journaled in `gs.scheduledV7`, so Replay/Undo/Redo/SaveLoad already reproduce it. The delayed action is a plain scheduled handler call (`API.specialSummon`), not a chain-linked effect, matching the no-chain-block ruling.
- `API.linkMutual` (System v9) once the Fusion Summon actually happens, for the two-way "card leaves → destroy monster / monster destroyed → destroy card" link.
- `API.specialSummon`'s existing generic special-summon-restriction and Monster-Zone-space checks for the delayed summon — no new negation logic needed.

### A real-duel bug found and fixed during this unit

An R1 probe (seed `0x59310001`, first=1, 【Dragunity】 vs 兎ラギア, turn 8) showed the AI driver re-activating an *already-resolved* 未来融合 straight off the field (`duelActivateFromZone(0,'sz',0)`), because `getLegalZoneActions` offers "⚡ 効果を発動" for any face-up card with a scripted `resolve()`, with no distinction between a genuine repeatable ignition effect and a one-shot Continuous Spell activation. Neither `ctx.zone` nor `locateCard`'s real zone nor `ctx.eventName` nor `card.activationPending` distinguish "activating for the first time" from "already resolved and sitting on the field" here (all four are identical in both cases — traced and confirmed against `engine/30_processor_chain_battle.js` `strictScriptLegalityV2` and `engine/40_legal_script_engine.js` `getLegalZoneActions`/`strictScriptLegality`). Fixed narrowly: `resolve()` sets a dedicated per-card flag (`API.setCardFlag(...,'u59FutureFusionResolved',...)`) and `condition()` refuses once it is set. Flagged the broader question (whether other TESTED Continuous/Field/Equip Spells with a bare `resolve()` share this shape) as a separate follow-up task rather than widening this unit.

## Dedicated test

`node tools/test_s03_u59_future_fusion.js` — 30 assertions, all pass. Covers, on the real DUEL path (no rigged boards, no unsupported-as-success):

- **A.** Full cycle: activation creates a chain link, resolution opens a real 5-of-6 Dragon-type material choice (not an auto-pick), the 6th stays in the Deck, F・G・D stays in the Extra Deck until summoned, the Special Summon is scheduled for turn+4 (the 2nd own Standby Phase, not turn+2), nothing happens at the 1st own Standby Phase (confirming the errata split does not apply), the Special Summon at the 2nd own Standby Phase creates no chain link, and the fired schedule entry is consumed. Also confirms the resolved card is never re-offered as an "effect" action (the bug above).
- **B/C.** `API.linkMutual` both directions: destroying the Special Summoned F・G・D destroys 未来融合, and destroying 未来融合 itself (after the summon) destroys F・G・D.
- **D.** The card leaving the field before the 2nd own Standby Phase aborts the delayed Special Summon; F・G・D stays safely in the Extra Deck, no illegal summon, no leftover schedule.
- **E.** Activation negated by マジック・ジャマー: no material choice ever opens, nothing is scheduled, the card goes to the GY untouched, the Deck is untouched.
- **F.** An empty Extra Deck: activation is still legal (2011 FAQ shape), the effect fizzles safely with no crash.
- **G/H.** SaveLoad round-trip mid-wait (saved right after the material choice, before either Standby Phase fires, reloaded into a fresh VM): the schedule survives, and the delayed Fusion Summon still fires correctly there, reaching the *same final Replay digest* as the uninterrupted run.
- A Replay audit runs after every state-changing step across all six cases.

## Real-duel measurement

R1 sweep, 【Dragunity】 vs 1103兎ラギア, `data/r1_lists/major_decks_v1_dragunity.txt`, seeds `0x59310001`–`0x59310007`, both first-player orders (14 duels): **14 / 14 completed**, Replay ok, `unsupported: []` in every duel (previously the only tolerated gap on this list). 未来融合 was drawn and activated for real in at least one of these duels (confirmed via the ops journal) and no longer offers the illegal field re-activation.

`data/r1_lists/known_gaps_v1.json`'s `knownUnsupported` entry for this card is removed — the list is now empty.

## Gate

- `python tools/check.py` — EXIT 0, **12894 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError` (log `s03_u59_full_gate.log`).
- `python tools/script_coverage.py`: TESTED 2094 (+1), NOT_STARTED 1299 (-1); everything else unchanged.
- `python tools/s03_status_audit.py` — EXIT 0: 45 declared status changes observed, 0 off-target, promoted card keeps its registration and is seen by its declared test, TOTAL 4996.
- Acode build skipped for this unit per current instruction (generate only at release or on explicit request).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, and this report set aside): `4ab0b68bd23ae00c404b089fa6f4a8d69ce54f01d92ab1c940915d9a73f8de19` (758 files).

## Remaining

- The multi-slot named-material branch (`parseMaterialSpec` slots.length > 1) still auto-picks the first valid combo instead of asking, matching the existing ミラクル・フュージョン/超融合 precedent; no card in the fixed lists needs this branch today.
- F・G・D's own "このカードは融合召喚でしか特殊召喚できない" restriction is not engine-enforced generically (pre-existing gap shared with Miracle Fusion/Super Polymerization; harmless here).
- Whether other TESTED Continuous/Field/Equip Spells share the "re-offered as an effect once resolved" shape is unaudited — flagged as a follow-up task, not fixed here.
- Continue measurement-first major fixed-list/preset routes and pick the highest-value shared Requirement from the first fresh blocker, replay divergence, unsupported action, or repeated manual-only pattern (per WORK_QUEUE).
