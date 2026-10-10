# S03-U14 C-S03-11 SUMMON_COUNTER_PLACEMENT (Claude)

Base: `checkpoint_claude_s03_vs2_six_samurai_slice_20260911.zip`, SHA256 `81988a4ccb7d22566158b6de6d45d189be928d2ed955ab435188fe7473946fb2`.

## How it was found

- **VS2 planning probe** (`gate_of_six_probe.js`).
  - A Normal Summon of 真六武衆－カゲキ with a face-up 六武の門 placed **no** 武士道 counter.
  - Nothing was offered, and nothing in the journal touched counters.
  - With counters set by hand, the effect ran on legacy closure choices (`API.confirm` / `API.selectCard`) and had no 6-counter mode.
- **U14 cluster scan** (`u14_counter_scan.js`) of the 39 cards whose text is 「〜度に…カウンターを…置く」.
  - The scripted 魔力カウンター cards place counters through the engine's `spellCounterOnSpellResolve` (false positives).
  - The real gap is the 武士道 cluster:
    - 六武の門 and 六武衆の結束: IMPLEMENTED, but no code ever placed their counters;
    - 紫炎の道場: NOT_STARTED;
    - 六武院: ENGINE_GAP.

## Ruling basis (local rulings reference `1103_rulings_complete_v3_2`)

- **No chain; also in the Damage Step.**
  - R1103-SIXGATE-001 and R1103-SIXUNITED-001/003.
  - 2011 wiki snapshots: 《六武院》 Q&A 10/11/13 and 《紫炎の道場》 Q&A 11/02/11 (no chain block).
- **A simultaneous Special Summon of several 六武衆 is one event, so 六武の門 gets 2 counters, not 2 per monster.**
  - R1103-SIXGATE-002, historical_source_confirmed, high confidence.
  - The first implementation counted per monster, following the wording of the 六武院 ENGINE_GAP reason. The ruling check caught it, and it was corrected before publication. The first full gate, which passed at 11991 / 0 with per-monster counting, is superseded.
- **Every face-up 六武の門 gets its own 2** (R1103-SIXGATE-003).
- **六武の門 modes.**
  - 2 counters: an ignition effect targeting a 六武衆 or 紫炎 **effect** monster. It cannot target a Normal Monster (wiki 10/10/09; R1103-SIXGATE-008). It can be repeated on the same monster, and the boost stays after the gate leaves (R1103-SIXGATE-006).
  - 4 counters: no target; the card is chosen at resolution from the Deck or GY (R1103-SIXGATE-004/005). Under ライオウ only the GY can be used (R1103-SIXGATE-009). A GY 真六武衆－シエン goes to the Extra Deck (R1103-SHIEN-004).
  - 6 counters: targets a GY 「紫炎」 effect monster (R1103-SIXGATE-010). 真六武衆－シエン does not qualify (wiki 10/11/15).
  - Removing counters is a cost (wiki 10/09/19).
- **六武衆の結束.** Sends itself to the GY as cost and draws the number of counters it had; it cannot be used with 0 (R1103-SIXUNITED-002/004).
- **紫炎の道場.** Cannot Special Summon 六武衆の侍従, a Normal Monster (wiki 11/02/14).

## Measurement before the fix (VS2 build)

The U14 test run on the published VS2 build gave **13 PASS / 10 FAIL**, then threw.
- No counters were placed in any summon case: Normal Summon, trigger Special Summon, the opponent's summon, or a simultaneous event.
- 六武院 had no ATK-down and could not be activated (no script).
- The legacy 六武の門 condition accepted a single counter.
- No mode choice opened, so the test threw at H and never reached the save point.

## Requirement closure record

- **Requirement.** Each time a 「六武衆」 monster is Normal or Special Summoned, every face-up applying card that says so gets its 武士道 counters.
  - Placement happens at summon success, without a chain, once per summon event, and respects the card's maximum.
  - The cards' own effects then spend those counters as cost, with choices that survive SaveLoad and Replay.
- **Root cause.**
  - **ENGINE_MISSING.** No mechanism placed counters on summon events.
    - The legacy 六武の門 `passive` returned true, but a card-activation-free Continuous Spell is correctly not a SEGOC trigger (U10), so even the legacy intent never placed counters.
  - **INTEGRATION_MISSING, found while converting the cost cards.** `activationLinkForContextV11` resolved `ctx.chainId` only against `gs.chain`, and the resolving link has already left `gs.chain`. So `API.activationCosts` and `API.declared` fell back to the cleared pending lists at resolution.
    - Probe: the link carried `activationCost [{kind:'bushido-self', amount:2}]`, yet `API.activationCosts(ctx)` returned `[]` inside `resolve`.
- **Closure.**
  - **`engine/1N_summon_counter_s03.js`, `applySummonCountersS03(gs,item)`.**
    - Declaration: `summonCounterS03:{kind,n,group,label}`.
    - Called where summon-success events are queued, inside the same Action:
      - the `EVENT_QUEUE_V31` reducer;
      - the in-action branch of `queueDeferredEventV2`;
      - the `EX_SUMMON_COMMIT_V42` direct push.
    - Placement: n counters once per event when at least one summoned monster is face-up in the Monster Zone and in the P4 group (`SIX_SAMURAI_NAMED`). 紫炎 cards are excluded although they share setcode 0x1000.
    - Observers: face-up S/T or Field Zone cards; not effect-negated; not waiting on their own card activation on the chain.
    - Maximum: `counterMaxV22`.
  - **`engine/10_activation_choice_v11.js`.** When the chain lookup misses, it uses `ctx.chainLink` if its `chainId` matches. The existing link-then-pending fallbacks are unchanged.
  - **`cards/H3_claude_s03_bushido.js`.** The legacy 10_themes_a definitions were removed.
    - **六武の門.**
      - The mode choice lists only legal modes; handlers `s03u14.gate-mode`, `gate-pay`, `gate-target`, `to-hand`.
      - Counter cost comes from any own field card, with a unit choice when two or more cards hold counters.
      - The 2 and 6 modes target after the cost; the 4 mode chooses at resolution from Deck (not under ライオウ) or GY.
    - **六武衆の結束, 紫炎の道場.** The card is sent to the GY as cost before the chain. The count at cost time is kept in the activation cost `amount`.
    - **六武院.** Continuous −100 ATK per counter to the opponent's monsters. Not activatable while face-up; card activation from the hand is declared card-activation-free.
- **Consumers.**
  - Summon placement: 六武の門 (2), 六武衆の結束 (1, max 2), 紫炎の道場 (1), 六武院 (1).
  - The resolution-time lookup fix also serves the existing `API.activationCosts` / `API.declared` users in `cards/89_p11_activation_choice_recovery.js` (3), `cards/9C_characteristic_recovery.js` (3) and `cards/9J_class_a_recovery_02.js` (1). Their existing tests run in the full gate.
- **Recovery (declared in `data/s03_status_changes.json`).**
  - 六武の門 IMPLEMENTED→TESTED, 六武衆の結束 IMPLEMENTED→TESTED, 紫炎の道場 NOT_STARTED→TESTED, 六武院 ENGINE_GAP→TESTED.
  - The 六武院 ENGINE_GAP override was removed.
  - The historical batch18 list now records 六武院 as unlocked, following the `lpUnlocked` precedent.
- **Dependent classification.**
  - **① Covered by the test.**
  - **② Remaining.**
    - R1103-SIXGATE-007: when 六武の門's effect is negated, its counters are all lost (medium confidence). Not implemented: counters are kept while negated, and only new placements stop.
    - Other "each time …" counter cards with different events, e.g. ドングリス, ワーム・イリダン, 剣闘獣の檻－コロッセウム, 強欲なカケラ, 種子弾丸 (ENGINE_GAP), and NOT_STARTED rows such as 古代の機械城, 宝玉の樹, D・フィールド. They need their own events, not this summon placement.
    - 六武衆 NOT_STARTED monsters (イロウ, カモン, ニサシ, ヤリザ, 真六武衆－シナイ, 紫炎の老中 エニシ, 大将軍 紫炎) are separate card work.
  - **③ Astra review.**
    - The 六武院 ENGINE_GAP reason asked for per-monster counting of simultaneous summons. No 六武院-specific simultaneous ruling was found. The same wording on 六武の門 is confirmed as one placement per event (R1103-SIXGATE-002), so the engine applies that to all four cards. If Astra holds a 六武院-specific source for per-monster counting, the declaration needs a per-card option.
    - The 4-counter filter follows `data/carddata.json` 「六武衆」モンスター. The DB records no ruling on Normal Monster 六武衆 for this mode.
    - Special Summons use Attack Position, following the existing `p1cards.special-summon` convention.
- **Practical effect.** In a real duel, 六武の門 now fills up as 六武衆 are summoned and its 2 / 4 / 6 effects can be used. 六武衆の結束 and 紫炎の道場 work as deck engines, and 六武院 weakens the opponent's monsters. Before, these cards could never do anything.

## Changed files

- `engine/1N_summon_counter_s03.js`: new; in the manifest after 1M.
- `engine/00_state_actions.js`: two single-line hooks.
- `engine/30_processor_chain_battle.js`: one single-line hook.
- `engine/10_activation_choice_v11.js`: resolving-link fallback.
- `cards/H3_claude_s03_bushido.js`: new; in the manifest after H2.
- `cards/10_themes_a.js`: legacy 六武の門 / 六武衆の結束 removed, with a pointer comment.
- `data/script_status_overrides.json`: 六武院 override removed.
- `data/s03_status_changes.json`: +4 declarations.
- `tools/test_s03_u14_summon_counters.js`: new; wired into `tools/check.py`.
- `tools/test_v660_batch18.js`: historical record list updated.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by a guarded transform (every pattern had to match exactly once; `--dry` first), except the reviewed one-line lookup fix and the ruling correction (reviewed edits). `dist/*.html` were not edited by hand. Every non-target card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u14_summon_counters.js`.** EXIT 0, 50 PASS:
  - real Normal Summon and trigger Special Summon; a 紫炎 negative; the opponent's summon;
  - a simultaneous event (one placement, two gates, and an event with no face-up 六武衆); observer states; legality;
  - all three 六武の門 modes (ライオウ Deck exclusion, split cost, シエン to the Extra Deck);
  - 六武衆の結束, 紫炎の道場, 六武院 ATK;
  - Replay audits and second-VM restore at the mode choice.
  - On the unfixed VS2 build: 13 PASS / 10 FAIL, then it threw.
- **Full gate.** `python tools/check.py`: EXIT 0, **11992 PASS / 0 FAIL**.
  - The S03 audit observes 19 declared status changes, with 0 off-target; the Astra01 and Astra02 audits pass (`s03_u14_full_gate.log`).
  - The ReferenceError lines printed by two older tests (`c1ElementOnField`, `isEffectNegated`) were already in the VS2 gate log; both tests pass.
  - Superseded first run (per-monster counting, before the ruling correction): EXIT 0, 11991 / 0; not published.
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996 (was TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187).
- Static registrations: 2253 (was 2251; 紫炎の道場 and 六武院 are new scripts).
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `7f1ec1dff0184ef92ee8b508e8b656ee3ea0c153c633c14931dc8356fd5ffd89` (609 files).
