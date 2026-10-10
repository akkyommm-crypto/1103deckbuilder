# S03-U29 C-S03-25 NEGATED_ACTIVATION_TO_GRAVE (Claude)

Base: `checkpoint_claude_s03_u28_targeting_negation_20260912.zip`, SHA256 `c20ca9646fa72364868a7c0fb044ad69cb5926b1e8eae05863695e4afc238d31`.

## How it was found

- **S03-U28 ② (measured during the U28 gate).** After ミドル・シールド・ガードナー negated the activation of P2's シールドクラッシュ, the Spell stayed in P2's Spell & Trap Zone (`sz1:["シールドクラッシュ"]`, GY empty). A Normal Spell whose activation is negated belongs in the GY.
- **Second real path (scratchpad probe on the U28 build).** ダメージ・ポラリライザー negates the activation of 火の粉 without destroying it: 火の粉 also stayed in the Spell & Trap Zone (`sz1:["火の粉"]`), and the Replay audit reproduced that state exactly, so it is engine behaviour, not a test artefact.
- **Ruling source (1103 set).** `R1103-SUPERVISE-002` (スーペルヴィスの発動を神の宣告で無効): 「カードの発動を無効にされた場合、表側表示でフィールド上から墓地へ送られた扱いにならない」 — the card goes to the GY, but its own "sent from the field" trigger does not apply. Its `simulator.ruleKey` is `negated_activation_not_treated_as_on_field`, `expected: activation_negated -> send_to_grave_from_activation_limbo -> no_grave_trigger`.
- **Source measurement.**
  - `resolveOnePreparedLinkV27` returns immediately for an activation-negated link, before `afterPreparedResolve` → S03-U07's `settleResolvedSpellTrapV32` (C-S03-04), which is what sends resolved Normal / Quick-Play / Counter Spells and Normal / Counter Traps to the GY.
  - The existing non-destroying negations get the card off the field themselves (ゴブリンのその場しのぎ returns it to the hand, 誤作動 sets it again); the destroying ones (マジック・ジャマー, 神の宣告-type) use `negateChainLinkV13(..., destroySource=true)`. Nothing covered the plain case.
  - `effectClass` cannot tell a card activation from an effect activation: a Trap script with `passive` is classified `TRIGGER_O`. Hand activations pass `opts.cardActivation` / `opts.onAbort`; set cards are still face-down when `prepareDuelActivation` starts.

## Measurement before the fix

- The U29 test on the U28 build: **10 PASS / 3 FAIL**. The three functional cases fail (火の粉 via ダメージ・ポラリライザー, シールドクラッシュ via MSG, the set 岩投げアタック); every control and all six Replay audits pass.
- On this build with `settleNegatedCardActivationS03` disabled in memory: **11 PASS / 3 FAIL** — the same three cases.
- Test-side correction: the first draft's "not sent from the field" check counted every queued event for the card, including `onActivateSuccess`, which any activation queues. It now looks only at the events an FX_TO_GRAVE from the field causes (onDestroy / onSendToGrave / onRemove) plus the GY record.

## Requirement closure record

- **Requirement.** A Spell/Trap card whose **card activation** is negated is sent to the GY when that chain link resolves. It is not destroyed, and it does not count as sent from the field to the GY.
- **Root cause (MISSING_RULE).** The activation-negated branch of `resolveOnePreparedLinkV27` returned without settling the card, so a card that no negation effect moved or destroyed stayed face-up on the field forever, holding its zone.
- **Closure.**
  - **`engine/1U_negated_activation_grave_s03.js` (new).**
    - `cardActivationMarkerS03(db, zone, card, opts)`: a Spell/Trap activation from the hand (`opts.cardActivation` / `opts.onAbort`) or from the set state (`card.face==='down'`) is a card activation. The activation of an effect of a Continuous/Field/Equip card already face-up is not.
    - `settleNegatedCardActivationS03(link)`: if the card is still face-up in the zone it was activated in, `FX_SELF_TO_GRAVE` sends it to the GY — no destruction, no `graveInfo`, and none of FX_TO_GRAVE's field events.
  - **`engine/30_processor_chain_battle.js`:** the marker is computed before the set card is turned face up, and passed to both DUEL `CHAIN_ADD` sites (`prepareDuelActivation` `finishPrepare` and `commitPreparedActivationV11`); the activation-negated branch calls the settle function before returning.
  - **`engine/00_state_actions.js`:** the CHAIN_ADD reducer copies `cardActivationS03` onto the link, written only when true, so existing Replay digests do not change.
- **Consumers.** Every negation that negates a card activation without destroying the card: ミドル・シールド・ガードナー (C-S03-24), ダメージ・ポラリライザー, フュージョン・ガード, and the destroying negations unchanged.
- **Recovery.** No status change (all TESTED). In a real duel the negated card now leaves the zone it was blocking.
- **Dependent classification.**
  - **① Covered by the real-path test (each with a Replay audit):**
    - 火の粉 (a Normal Spell from the hand) negated by ダメージ・ポラリライザー → P2's GY, no damage, no destroy / send-to-GY / field-departure event, and no GY record naming a field zone;
    - シールドクラッシュ negated by MSG → P2's GY, MSG still face-up in Defense Position;
    - the set Normal Trap 岩投げアタック negated by ダメージ・ポラリライザー (activation from the set state) → P2's GY, nothing milled, no damage;
    - control: ゴブリンのその場しのぎ returns the negated 火の粉 to the hand;
    - control: 誤作動 sets the negated 岩投げアタック face-down again;
    - control: an unnegated 火の粉 still deals 200 damage and goes to the GY.
  - **② Remaining.**
    - System v9's generic `onLeaveField` (the zone snapshot diff in `engine/18_leave_field_v9.js`, which also feeds the survival links) still reports the departure. No 1103 card reacts to a Spell/Trap leaving the field, so this is recorded rather than suppressed in a shared scanner.
    - Manual / legacy `CHAIN_ADD` paths (engine/20, engine/40 `addChainLink`, engine/70) carry no marker; DUEL mode uses the two hooked paths.
    - Keep-type (Continuous / Field / Equip) card activations carry the marker, but 1103 has no non-destroying negation that can target one, so that branch has no real-path test.
  - **③** None.
- **Practical effect.** A negated Spell or Trap no longer sits face-up in the Spell & Trap Zone for the rest of the duel: it goes to the GY, the zone frees up, and its own "sent from the field" triggers stay off.

## Changed files

- `engine/1U_negated_activation_grave_s03.js`: new; registered in `build_manifest.json`.
- `engine/30_processor_chain_battle.js`: marker before the flip; both CHAIN_ADD sites; settle in the activation-negated branch.
- `engine/00_state_actions.js`: CHAIN_ADD reducer copies the marker.
- `tools/test_s03_u29_negated_activation_to_grave.js`: new; wired into `tools/check.py` after U28.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The engine edits were applied by a guarded transform (exactly-once patterns; `--dry` first; scratchpad `u29_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u29_negated_activation_to_grave.js`.** EXIT 0, 14 PASS. Before: 10 PASS / 3 FAIL on the U28 build; 11 PASS / 3 FAIL with the settle disabled on this build.
  - Regression suites on the same build, all EXIT 0: U07 (32), U10 (33), U17 (20), U18 (15), U19 (14), U25 (13), U27 (10), U28 (15), VS4 (25), VS6 (11), `test_effect_category_cards` (48), `test_auto_cycle14` (112), `test_negation_cards` (84), `test_effect_negation` (7), `test_v440_activation_replay` (9), `test_v440_native_cards` (18), `test_v460_native_cards` (51), `test_activation_event_v12` (47).
- **Full gate.** `python tools/check.py` (with S03-U29): EXIT 0, **12297 PASS / 0 FAIL** (U28's 12283 + U29 14). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u29_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- `docs/SCRIPT_COVERAGE.md` is byte-identical to U28; `data/script_coverage.json` differs only in test-evidence lists, which now name the U29 test. No status changes.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `b3a78a97c49374eedc8eb3ad68746beda838fc917d78c58cec20c2ca8edfc1a6` (658 files).
