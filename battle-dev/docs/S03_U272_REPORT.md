# S03-U272 — 4 ENGINE_GAP re-check cards (防御輪, ダメージ・ワクチンΩMAX, 悪夢の拷問部屋, 同族感染ウィルス); ドッペル・ゲイナー and キックバック parked

## Workflow (mixed, Sonnet 5.5 battle-implementer owned the unit)
- No engine change. The unit reuses `onLPChange` (sourceUid / byPlayer / cause), LP rules scoped to a chain link (S03-U267), `declareActivationResponseS03`, `requestDeclarationV11` kind `race` with `p11cards.declare-commit`, and the discard-cost recording of `p11cards`.
- Cards in `cards/HZZZZZ_claude_s03_u272_gap3.js`; test `tools/test_s03_u272_gap3.js` (39 asserts, real DUEL paths, Replay-audited).

## Cards -> TESTED (2011 texts)
- **防御輪** (Quick-Play Spell): a chain response (hand or Set) to the activation of a Trap card whose effect inflicts damage, either player's; an LP rule (effect, prevent, no player) scoped to that link makes its damage 0.
- **ダメージ・ワクチンΩMAX** (Trap): battle or effect damage to you; recovers exactly that amount.
- **悪夢の拷問部屋** (Continuous Spell): forced trigger when its controller inflicts non-battle damage on the opponent (`byPlayer`): 300 more; never for damage from any 「悪夢の拷問部屋」 (source card name). 墓守の従者's battle damage counts (effect damage, S03-U271).
- **同族感染ウィルス** (monster ignition, own Main Phase): discard 1 (cost) and declare a Type at activation; resolution destroys every face-up monster of that Type on both fields, itself included; face-down monsters are not destroyed.

## Not done
- **ドッペル・ゲイナー** stays ENGINE_GAP (open ruling, master-prompt TESTED rule). It is a Continuous Trap whose text has no 「発動できる」: either the card's one activation is the effect (and the face-up card does nothing more), or the effect applies every time the condition is met. The implementation worked (onLPChange, effect damage whose `sourceUid` is a monster on the opponent's field, the same amount to the opponent) but was removed until the ruling is given. Needs: an Opus ruling.
- **キックバック** stays ENGINE_GAP. A negated Normal / Flip Summon is cancelled by `runSummonWindowResumeS03` (engine/40), which moves the monster to the GY (hand -> GY for a Normal Summon, FX_TO_GRAVE for a Flip Summon). Leaving it in the hand needs an engine change (a flag on the summon window carried by the journaled `SUMMON_WINDOW_NEGATE_V42` action). Reproduction: a Set キックバック, the opponent Normal Summons ベビードラゴン, the Trap is chained from the summon window: the monster ends in the GY, not the hand.

## Existing tests adjusted (status records; no behavior assertion changed)
Each check becomes an "unlocked" check (`!ov[n]`) with the comment `S03-U272: implemented and tested; kept as a record`; every count is unchanged:
- `test_v490_batch01` (防御輪), `test_v820_batch33` (ダメージ・ワクチンΩMAX), `test_v800_batch31` (悪夢の拷問部屋), `test_v590_batch11` (同族感染ウィルス).
- `test_v530_batch05` and `test_v540_batch06` are unchanged: キックバック and ドッペル・ゲイナー are still precise ENGINE_GAPs.

Negative control on U271: 17 FAIL (22 PASS, no crash).

## Opus review
- The 4 TESTED cards are accepted: each has a text → implementation → test basis above.
- ドッペル・ゲイナー ruling: a Continuous Trap; while it is face-up, its effect applies each time the condition is met (forced). It stays ENGINE_GAP here and is re-added in a later unit.
- キックバック needs an engine change (a negated Normal / Flip Summon must return the monster to the hand); it is Opus engine work.
- After the review of S03-U271 (2 fixes after its first gate), this unit was rebased onto the final U271 and its pre-scan + gate were re-run.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17235 PASS / 0 FAIL** (= U271 17196 + 39 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U271.
- Coverage: TESTED 2863, ENGINE_GAP 529, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 824 declared, 0 off-target.
- Published in the batched checkpoint S03-U272–U275.
