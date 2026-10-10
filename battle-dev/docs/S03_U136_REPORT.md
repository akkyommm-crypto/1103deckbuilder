# S03-U136 — ワーム・ヤガン + W星雲隕石 (fixed Worm list, x3 each); face-down Special Summon

## Why
A check of the fixed major-deck lists against coverage found 18 cards that are still not TESTED. The 3-copy ones matter
most. Two are in the Worm list:
- ワーム・ヤガン was NOT_STARTED.
- W星雲隕石 was an AUTO_DECK_TABLE "recruit ignition" (PARTIAL), a plain Deck recruit that does none of its text.

## Change
- `engine/00_state_actions.js` `FX_SPECIAL_SUMMON`: `faceDown:true` (passed through `API.specialSummon`'s opts) summons
  face-down in Defense Position. `summonedTurn` already blocks a Flip Summon that turn. The log hides the name.
- New `cards/HU_claude_s03_u136_worm.js` (added to `build_manifest.json`):
  - ワーム・ヤガン (v4):
    - `revive`: an ignition in the GY. The own field must hold exactly one monster, a face-up ワーム・ゼクス. The card is
      Special Summoned face-down DEF and flagged `banishWhenLeavesField`.
    - `flip-bounce`: a forced `onFlip` trigger that targets a face-up opponent monster and returns it to its owner's hand. It
      does not activate if there is no target.
  - W星雲隕石 (trap):
    - Every face-down monster is turned face-up DEF with `API.flipFaceUpByEffect`, so reversal effects trigger.
    - This turn's End Phase runs a System v7 task (`s03u136.w-nebula-end`): own face-up LIGHT Reptiles are turned face-down
      DEF, the player draws that many, then may Special Summon a Lv7+ LIGHT Reptile from the Deck (optional choice
      `s03u136.w-nebula-summon`).
    - The summon is offered only when at least one monster was turned face-down (「その後」). This reading is recorded as
      an assumption.

## Test — `tools/test_s03_u136_worm_yagan_nebula.js` 19/0 (real DUEL path; the End Phase is reached through the processor; Replay-audited)
- A: ヤガン revival.
  - Legal with a lone face-up ゼクス. It lands face-down DEF, cannot be Flip Summoned that turn, and is banished when
    destroyed.
  - Illegal with another monster, with a face-down ゼクス, or with an empty field.
- B: Flip Summon → the forced trigger returns the face-up ゴブリン突撃部隊, not the face-down opponent monster.
- C: W星雲隕石.
  - Both sides' face-down monsters become face-up DEF. ヤガン's reversal effect bounces the opponent monster. The trap goes
    to the GY, and one End Phase task is scheduled.
  - In the End Phase, ヤガン and アグリィ are turned face-down (ワイト stays face-up), 2 cards are drawn, and ワーム・キング is
    Special Summoned.
- D: with no LIGHT Reptile face-up at the End Phase, nothing is drawn and no summon is offered.
- Negative control on U135: 10 FAIL.
- Pre-scan of all 355 gate tests (parallel): 0 FAIL.

## Not in this unit (recorded)
- W星雲隕石's summon uses ATK (the effect Special Summon position choice is still a general deferred item).
- Still not TESTED in the fixed lists:
  - 六武衆の影武者 (ENGINE_GAP: redirecting a target needs an engine capability);
  - 天刑王 ブラック・ハイランダー, 波動竜騎士 ドラゴエクィテス (NOT_STARTED);
  - シューティング・クェーサー・ドラゴン (PARTIAL);
  - the IMPLEMENTED singles: エスクリダオ, N・グラン・モール, アーカナイト・マジシャン, ガチガチガンテツ,
    キメラテック・フォートレス・ドラゴン, グローアップ・バルブ, メタモルポット, ライラ, 魂を削る死霊, 魔轟神 ×3.

## Status
- ワーム・ヤガン NOT_STARTED → TESTED, W星雲隕石 PARTIAL → TESTED (focus registered).
- TESTED 2203 → 2205, NOT_STARTED 1265 → 1264, PARTIAL 170 → 169.
