# S03-U194 — Spells / Traps (9 script fixes)

## Findings and fixes
Eleven Spell / Trap cards had scripts (IMPLEMENTED) but no dedicated test. Nine did not follow the text.

| Card | Problem → fix |
|---|---|
| モンスターゲート | The Tribute was a target sent at resolution → a cost. 「通常召喚可能」 excluded nothing → `cannotNormalSummonS03`. A summon from the Deck shuffles it, so the revealed cards now go to the GY first. |
| 停戦協定 | Any monster allowed the activation, and only the opponent's effect monsters were counted → the condition from the text, and every face-up effect monster on the field is counted after the face-down Defense monsters are flipped (FX_SET_STATE: no flip event). |
| R－ライトジャスティス | With fewer Spell / Trap cards than 「E・HERO」 cards it fizzled → it destroys all of them. The Field Zone is now counted; this card itself is excluded. The choice can't be cancelled. |
| スクラップ・スコール | Its Deck choice could be cancelled → mandatory. |
| 万能地雷グレイモヤ | Its tie-break choice could be cancelled → mandatory. |
| 降霊の儀式 | Accepted any card containing 墓守 → monsters named 「墓守の」. |
| 鹵獲装置 | 「お互いが…1体ずつ選択し」: the activating player chose both monsters, and could cancel → the opponent chooses its own monster, and neither choice can be cancelled. The shared handler also applies this to 強制転移; TG1－EM1, which targets both itself, is unchanged. |
| 光の護封壁 | The legacy cost offered pseudo-cards and lost the amount in DUEL (LP became null, wall 0) → the amount is declared at activation (P1.1 choice `s03u194.light-wall-pay`), paid, recorded, and stored as `wallValue` at resolution. |
| 聖なる輝き | Its `noFaceDownSet` was never read → the set path stamps `faceUpSetS03` on SET_MONSTER (`mustSetFaceUp`), and the reducer places the monster face-up in Defense Position (still a set, not a summon). |

## Cards (IMPLEMENTED → TESTED)
The nine above, plus デルタ・クロウ－アンチ・リバース and 因果切断 (scripts unchanged, now tested).

## Tests
`tools/test_s03_u194_spells_traps.js` 27/0 (real DUEL paths, Replay-audited). Negative control on U193: 10 FAIL.

Existing tests of 強制転移 / TG1－EM1 still pass: `test_s03_u186` 26/0, `test_s03_u107` 8/0.

## Left
おジャマトリオ stays IMPLEMENTED. Its tokens need 「アドバンス召喚のためにはリリースできない」 and 「破壊された時にそのコントローラーは1体につき
300ダメージ」, and destroyed tokens vanish inside several reducers. It is recorded on the pending list.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15095 PASS / 0 FAIL** (= U193 15068 + 27 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U193.
- Coverage: TESTED 2408, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 16, GENERIC_OK 644, PARTIAL 121 (4996); audit 369 declared, 0 off-target.
