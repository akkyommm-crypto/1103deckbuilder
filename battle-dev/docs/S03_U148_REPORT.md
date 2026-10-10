# S03-U148 — Gemini batch 3: 水面のアレサ, 竜影魚レイ・ブロント, 炎妖蝶ウィルプス, 地獄の門番イル・ブラッド, 魔族召喚師

## Why
- The next Gemini monsters (WORK_QUEUE "remaining Gemini monsters"). All five were NOT_STARTED.
- ジェムナイト・アイオーラ / アンバー were looked at and left out:
  - their cost / target needs 「ジェム」 and 「ジェムナイト」 membership;
  - the 「ジェム」 monsters (ジェムエレファント, ジェムタートル, ジェムレシス, ジェム・マーチャント) have no setcode in the card data;
  - ジェム・エンハンス is tagged 0x100f (the ジェムナイト code) although its name is not a ジェムナイト name.

  Membership must come from the P4 authority, not name matching, so this needs a group decision first (recorded).

## Change
- New `cards/HZD_claude_s03_u148_gemini3.js`. All five use `defineGeminiS03` (U119), or check `geminiActiveS03` directly:

  | Card | Effect once Gemini Summoned |
  |---|---|
  | 水面のアレサ | when it destroys an opponent monster by battle and it is in the GY → the opponent discards 1 card at random (`v80DiscardRandom`) |
  | 竜影魚レイ・ブロント | original ATK 2300; after attacking, Defense Position at the end of the Battle Phase and position-locked until the end of its controller's next turn (the ゴブリン突撃部隊 pattern of `cards/B0`) |
  | 炎妖蝶ウィルプス | release itself (cost) and target a Gemini monster other than 炎妖蝶ウィルプス in its GY; Special Summon it, then set `dualUp` (treated as Gemini Summoned) |
  | 地獄の門番イル・ブラッド | once per turn, choose at resolution 1 Zombie from the hand or either GY and Special Summon it |
  | 魔族召喚師 | once per turn, in the Main Phase, choose 1 Fiend from the hand or either GY and Special Summon it |

  - イル・ブラッド and 魔族召喚師 share the rest:
    - the summoned monster gets `s03SummonedByUid = summoner uid`;
    - when the summoner leaves the field face-up, a forced `onLeaveField` trigger (its own event, `eventIsSelfS03`) destroys every
      monster still carrying that uid.
- `engine/00_state_actions.js`: `s03SummonedByUid` is added to `ZONE_LOCAL_KEYS`. The mark is forgotten when the summoned
  monster leaves the field.

## Test — `tools/test_s03_u148_gemini3.js` 23/0 (real Gemini Summon, phase changes, attacks and activations through the processor; Replay-audited)
- A 水面のアレサ: destroys ワイト → the opponent's hand 2 → 1. Control: not Gemini Summoned → no discard.
- B 竜影魚レイ・ブロント:
  - ATK printed → 2300;
  - 2000 damage to ワイト;
  - in Main Phase 2 it is in Defense Position with the lock until turn + 2.
- C 炎妖蝶ウィルプス:
  - It is released and E・HERO アナザー・ネオス is Special Summoned with its Gemini effect on (name treated as E・HERO ネオス).
  - The other ウィルプス in the GY is not a candidate.
  - Not Gemini Summoned → cannot be activated.
- D 地獄の門番イル・ブラッド:
  - the opponent's GY ワイト is summoned under its control;
  - a second use this turn is refused;
  - 強制脱出装置 returns イル・ブラッド → that ワイト is destroyed, while another Zombie stays.
- E 魔族召喚師:
  - デーモンの召喚 from the hand; 強制脱出装置 → デーモンの召喚 destroyed;
  - not Gemini Summoned → cannot be activated.
- Negative control on U147 (`dist/battle.html` + this test): 13 FAIL, 0 errors.
  - The first run had two D checks passing vacuously on U147. They are now tied to the summon having happened.

## Not in this unit (recorded)
- A summoner turned face-down and face-up again keeps its old marks. It no longer has the effect, but would still destroy them when
  leaving.
- ジェムナイト・アイオーラ / アンバー (P4 「ジェム」 group decision, ジェム・エンハンス setcode).

## Status
- NOT_STARTED → TESTED: 水面のアレサ, 竜影魚レイ・ブロント, 炎妖蝶ウィルプス, 地獄の門番イル・ブラッド, 魔族召喚師.
- TESTED 2223 → 2228, NOT_STARTED 1254 → 1249.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14282 PASS lines (= U147 14259 + 23 new, exactly), 0 FAIL, no Traceback / ReferenceError
  (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- Pre-scan of all 367 gate tests (parallel): every exit code 0, 0 FAIL; per-file PASS / Error counts equal to U147 except the new test.
- `dist/battle.html` SHA256 `ab882ae714a02050f1cb07767cc46fab69d3ad845f4294774b1f8c908e6cbb62` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `47359659c4084d476d06e129d19786cfc25e3327cc80910ce863f23220a6ba14`.
- Coverage: TESTED 2228, IMPLEMENTED 94, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1249 (4996); 195 declared status
  changes, 0 off-target.
