# S03-U259 — Activation locks on monster effects: 超古代生物の墓場, インヴェルズの歩哨, エンジェルO7, ランドオルスのヒカリゴケ, 苦痛の回廊, 古代の機械砲台, ナチュル・バンブーシュート

## Workflow
- opus-only, because it is engine work.
- Built on U257 while U258 ran, then rebased onto U258 (`rebase_unit.py`). The pre-rebase tree is kept for U260.

## Engine (engine/1ZD)
- `activationLockS03` (S03-U217: face-up cards forbidding Spell / Trap card activations) now also covers **monster effect activations** (`info.db.k==='m'`, any zone), with the reason 「…の効果によりモンスター効果を発動できません」.
  - Every existing `activationLockS03` function tests `info.db.k` itself, so their behaviour is unchanged. The existing lock tests (15 files) still pass.
- **Lingering sources** registered this turn (`API.lingerS03`, S03-U257) are lock sources too, wherever the used card is.
- These locks feed `strictScriptLegalityV2`, which every activation, response list and trigger list uses.

## Cards → TESTED (2011 texts) — cards/HZZZZM_claude_s03_u259_locks.js
- **超古代生物の墓場:** face-up Level 6+ special summoned monsters on the field cannot activate effects or attack.
- **インヴェルズの歩哨:** while it is face-up in Attack Position, Level 5+ special summoned monsters on the field cannot activate effects.
- **エンジェルO7:** once Tribute Summoned (`summonProvenance`), effect monsters cannot activate effects while it is face-up.
- **ランドオルスのヒカリゴケ:** with a face-up 「ナチュル」, the opponent's effect monsters cannot activate effects this turn (lingering source).
- **苦痛の回廊:** monsters special summoned from the Deck are negated, cannot activate effects and cannot attack while face-up.
- **古代の機械砲台:** release it → 500 damage. During this turn's Battle Phase neither player can activate Trap cards (lingering source).
- **ナチュル・バンブーシュート:** when Tribute Summoned by releasing a 「ナチュル」 (`summonProvenance.materialRefs`, SETCODE.NATURIA), the opponent cannot activate Spell / Trap cards while it is face-up.

## Tests
`tools/test_s03_u259_locks.js` passes 22/0, on real DUEL paths and with the activation legality. Replay-audited.
- A: a Set 墓場 is activated, LV7 is locked and LV5 free, the attempt does nothing, LV7 cannot attack; a non-special-summoned control.
- B: 歩哨 in Attack vs Defense Position.
- C: a real 2-Tribute Summon of O7 vs a placed O7.
- D: ヒカリゴケ locks only the opponent; it is gone next turn; it needs a ナチュル.
- E: Deck vs hand origin under 苦痛の回廊.
- F: 機械砲台 deals 500; a Trap is still legal in the Main Phase; in the Battle Phase ミラーフォース is neither legal nor offered at the attack.
- G: バンブーシュート Tribute Summoned with ナチュル・クリフ vs with ワイト.

Negative control on U258: 11 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16715 PASS / 0 FAIL** (= U258 16693 + 22 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U258.
- Coverage: TESTED 2805, ENGINE_GAP 566, NOT_STARTED 948, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 766 declared, 0 off-target.
