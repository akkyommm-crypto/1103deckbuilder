# S03-U32 TARGETING_NEGATION_2 — C-S03-24 extension (Claude)

Base: `checkpoint_claude_s03_u31_manual_card_activation_20260912.zip`, SHA256 `cd87ee6d7633791ade8c841eca8910f8df5808eef7951ad03bbcc971306fb1a2`.

## How it was found

- **C-S03-24 ② (from U28, deferred at U30).** A text scan found 11 cards whose text negates what targets them. U28 declared two (ミドル・シールド・ガードナー, アルカナフォース0－THE FOOL); the rest were recorded as ②, with 無敗将軍 フリード and 大神官デ・ザード PARTIAL and カオス・マジシャン ENGINE_GAP.
- **Ruling sources (2011).**
  - 無敗将軍 フリード — wiki 10/06/11: 「魔法カードの効果を無効にする効果の種別は、永続効果となります」. So the negation is continuous, and it covers **Spell cards only**.
  - カオス・マジシャン — wiki 08/05/31 (the 氷結界の龍 case): 「1枚だけ捨てて カオス・マジシャン のみが選択された場合は、無効にします。2枚以上捨てて カオス・マジシャン およびそれ以外のカードが同時に選択された場合は、「カオス・マジシャン1体だけ」が対象に選ばれてないので効果により手札に戻ります」. So it negates only when it alone is the target, and it does **not** destroy.
- **Why it needed an engine change.** `spec.applies({link, srcDb, negator})` (C-S03-24, engine/1T) never received the link's target list, so 「このカード1枚を対象にする」 could not be judged at all.
- **Why the status rule was the real blocker.** Tests may name only TESTED / GENERIC_OK cards, and both consumers were below that bar. Measured before deciding: カオス・マジシャン had **no registration anywhere** and was pinned ENGINE_GAP by `data/script_status_overrides.json`, whose stated reason was *"Needs declarative effect source/type and single-target metadata so monster effects targeting only this card can be negated generically"* — precisely what this unit supplies. フリード's other effect (the Draw Phase replacement) is still the coarse `AUTO_DECK_TABLE` entry at `cards/40_auto_interpreter.js:193`, so it must stay PARTIAL.
- **Driver cards measured on real paths, not assumed.**
  - **ADチェンジャー** (TESTED, legacy): activates from the GY, banishes itself as the cost, `selectTargets` picks **exactly one** Monster Zone card, and its resolution changes that card's position — so a negation is observable as "position unchanged".
  - **使徒喰い虫** (TESTED, unified, 「リバース:フィールド上のモンスター2体を破壊する」): probed end-to-end (scratchpad `u32_flip_probe.js`) — the zone menu offers 反転召喚 → `doFlipUp` → summon window → `onFlip`, and the card raises **two** target rounds. That is the ruling's own two-target shape.
  - A・ボム was rejected as a driver: its condition needs a real battle destruction this turn (`a3SelfBattleDestroyed` plus `graveInfo.byDestroy/from==='mz'`), which would drag battle mechanics into a targeting-negation test.

## Measurement before the fix

- `tools/test_s03_u32_targeting_negation_2.js` on the U31 build: **10 PASS / 2 FAIL**.
  - Failing: ADチェンジャー changed カオス・マジシャン's position (`pos:"def"`, no negation); ソウルテイカー destroyed フリード (`freed:"grave"`, no negation).
  - Passing before and after (preserved baselines): the two-target 使徒喰い虫 control, the Spell-vs-カオス・マジシャン control, the Trap-vs-フリード control, and every Replay audit.

## Requirement closure record

- **Requirement.** A declared negator may require that **only itself** is targeted, and two more cards negate what targets them: 無敗将軍 フリード against Spell cards (negate and destroy), カオス・マジシャン against a monster effect that targets only it (negate, no destruction).
- **Root cause (MISSING_DATA + MODEL_WRONG).** The declaration hook could not see the link's targets, so single-target wording was unjudgeable; and neither card was declared or even registered.
- **Closure.**
  - **`engine/1T_targeting_negation_s03.js`:** `spec.applies` now also receives `targets` — the decoded target list of the link.
  - **`cards/H8_claude_s03_targeting_negation_2.js` (new):** declarations for both cards, the `s03OnlyThisTargetU32` helper (exactly one target and it is the negator), and a registration for カオス・マジシャン that refuses activation because its whole text is this continuous effect (the 六武院 pattern from S03-U14).
  - **`data/script_status_overrides.json`:** the カオス・マジシャン ENGINE_GAP override removed — the gap it named is what this unit implements.
  - **`data/s03_status_changes.json`:** カオス・マジシャン declared ENGINE_GAP → TESTED for S03-U32, with its evidence. フリード is deliberately **not** declared.
- **Consumers.** 無敗将軍 フリード (its negation closed; status stays PARTIAL for the draw-replacement effect), カオス・マジシャン (whole card closed; ENGINE_GAP → TESTED).
- **Recovery.** ENGINE_GAP 615 → 614, TESTED 2068 → 2069; no other status moved.
- **Dependent classification.**
  - **① Covered by the real-path test (each with a Replay audit):** ADチェンジャー targeting only カオス・マジシャン → negated, position unchanged, not destroyed, no chain block; a real 使徒喰い虫 flip summon targeting it together with another monster → **not** negated, both destroyed; a Spell (ソウルテイカー) targeting it → not negated; ソウルテイカー targeting フリード → negated and the Spell destroyed, フリード survives, no LP gained; a Trap (六芒星の呪縛) targeting フリード → not negated.
  - **② Remaining.** 大神官デ・ザード needs a per-battle-destruction counter (「1回目」). タイラント・ドラゴン, デス・デーモン・ドラゴン, ドラゴン・ウォリアー, 不死王リッチー, 超電磁稼動ボルテック・ドラゴン, TG ブレード・ガンナー, アルカナフォースEX－THE LIGHT RULER are NOT_STARTED with other unimplemented effects. フリード's Draw Phase replacement is still the coarse auto-table entry. Manual / legacy `CHAIN_ADD` paths remain unhooked (inherited from C-S03-24).
  - **③** None.
- **Practical effect.** カオス・マジシャン now does what its only line of text says, and 無敗将軍 フリード survives the Spell cards that target it — both on the paths a player actually takes.

## Findings

- **A card named only in a comment counts as test evidence.** `tools/script_coverage.py` is a static text scanner, so citing the 08/05/31 ruling by its card name (氷結界の龍 ブリューナク) promoted that card IMPLEMENTED → TESTED, which the status audit would have failed as an off-target change. The card name was removed from the comment rather than declaring a change the test does not exercise. Worth remembering for every future test header.
- A status promotion needs three things together: a registration under `cards/`, the card's name in a dedicated test, and no override pinning it — the audit checks all three.
- **The first full-gate run failed on an older test, not on the new one.** `tools/test_v500_batch02.js` reads `data/script_status_overrides.json` directly and asserted `ov['カオス・マジシャン'].status === 'ENGINE_GAP'`, so removing the override necessarily broke it (gate EXIT 1, 9838 PASS / 1 FAIL). That file already contains the idiom for this situation — a card whose gap was later closed moves into a named "unlocked" list asserting the override is **absent** — so the expectation was moved rather than deleted. A promotion is not finished until every batch-era expectation that pinned the old status has been updated the same way.

## Changed files

- `engine/1T_targeting_negation_s03.js`: `targets` threaded into `applies`.
- `cards/H8_claude_s03_targeting_negation_2.js`: new; registered in `build_manifest.json`.
- `data/script_status_overrides.json`: カオス・マジシャン override removed.
- `data/s03_status_changes.json`: the declared promotion.
- `tools/test_s03_u32_targeting_negation_2.js`: new; wired into `tools/check.py` after U31.
- `tools/test_v500_batch02.js`: the batch-era ENGINE_GAP expectation for カオス・マジシャン moved from `gaps` into a new `targetNegationUnlocked` list that asserts the override is absent — the file's own idiom for a gap later closed (`battleUnlocked`, `ritualUnlocked`), with a comment naming S03-U32.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The engine edit and the wiring were applied by a guarded transform (exactly-once patterns; `--dry` first; scratchpad `u32_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u32_targeting_negation_2.js`.** EXIT 0, **12 PASS** (before: 10 PASS / 2 FAIL on the U31 build).
- **Regression suites on the same build, all EXIT 0:** U28 (15), U29 (14), U30 (14), U31 (8), VS7 (21), `test_v510_batch03` (44), `test_auto_cycle01` (112), `test_auto_cycle05` (100), `test_effect_category_cards` (48), `test_negation_cards` (84).
- **Full gate.** `python tools/check.py` (with S03-U32): EXIT 0, **12352 PASS / 0 FAIL** (U31's 12340 + U32 12). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u32_full_gate.log`).
  - The **first** run of this gate failed (EXIT 1, 9838 PASS / 1 FAIL) on `tools/test_v500_batch02.js`'s stale ENGINE_GAP expectation; the log in this checkpoint is the passing re-run after that expectation was moved.
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- **ENGINE_GAP 615 → 614, TESTED 2068 → 2069**; NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 unchanged; TOTAL 4996. Static registrations rise by one (cards/H8).
- The **only** status change versus U31 is the declared one, カオス・マジシャン ENGINE_GAP → TESTED (`data/s03_status_changes.json`, unit S03-U32); the audit reports 0 off-target changes. Unlike the previous units, `docs/SCRIPT_COVERAGE.md` and `data/s03_status_audit.json` genuinely differ from U31, because a status actually moved.
- **Changed sources versus U31:** `engine/1T_targeting_negation_s03.js` is the **only** engine file, and **no existing file under `cards/` changed** — the unit adds `cards/H8_claude_s03_targeting_negation_2.js` and touches nothing else there. The remaining differences are `build_manifest.json`, `tools/check.py`, `tools/test_v500_batch02.js`, and the generated coverage/audit files (`u32_zipcheck.py` asserts this set).
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `e3a16f93939eb8b3ee7d9fd40b1bdfdb5bac4a4d739ce4f183a953f297303bc1` (667 files).
