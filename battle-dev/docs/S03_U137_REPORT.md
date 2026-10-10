# S03-U137 — fixed-list singles: 魂を削る死霊 (targeted → destroyed), N・グラン・モール (direct attack), メタモルポット / ライラ audits

## Why
Continuing the fixed major-deck lists' IMPLEMENTED singles (U136 list). Measured on U136:
- 魂を削る死霊 (bf x1): 「このカードがカードの効果の対象になった時、このカードを破壊する」 was missing. Its script's
  auditNote called it "the next stage of the targeting-event base".
- N・グラン・モール (rabbit x1): 「相手モンスターと戦闘を行うダメージステップ開始時」. On a DIRECT attack it also triggered and
  returned itself to the hand, so it dealt no damage.
- メタモルポット (dark x1) and ライトロード・マジシャン ライラ (debris x1) behaved correctly. They had no real-duel test.

## Change
- New `engine/1ZM_targeted_self_destroy_s03.js`: `declareTargetedSelfDestroyS03(name)` and `applyTargetedSelfDestroyS03()`.
  - The hook is called right after CHAIN_ADD, in both CHAIN_ADD paths, like the U28 negators and U66 protectors.
  - Every face-up monster-zone card among the new link's targets whose effects are not negated is destroyed at once, with
    no chain block. Any card effect counts, including its controller's own.
- `cards/38_1103_expansion_v380.js`: 魂を削る死霊 declares it.
- `cards/00_generic_core.js` N・グラン・モール: the condition and passive require monsters on both sides of the battle.

## Test — `tools/test_s03_u137_fixed_list_singles.js` 20/0 (real DUEL path, Replay-audited)
- A: 魂を削る死霊.
  - Targeted by the opponent's set 月の書: destroyed at once while 月の書 is on the chain, and 月の書 resolves with nothing.
  - Targeted by its controller's own 月の書: destroyed.
  - Attacked by ゴブリン突撃部隊: not destroyed, and its controller takes 2000.
  - Direct attack: 300 damage, and 1 random card of the opponent's hand is discarded.
- B: メタモルポット Flip Summon → hands of 1 and 2 cards discarded, and both players draw 5.
- C: N・グラン・モール.
  - Attacking ゴブリン突撃部隊 → both go back to the hand, with no damage.
  - A direct attack → no trigger, and 900 damage.
- D: ライラ.
  - ① destroys the set ミラーフォース, turns to DEF, and no position change is offered.
  - ② the End Phase (through the processor) mills 3.
  - Illegal in Defense Position.
- Negative control on U136: A (both targeting cases) and C (direct attack) fail.
- Pre-scan of all 356 gate tests (parallel): 0 FAIL.

## Status
- 魂を削る死霊, メタモルポット, N・グラン・モール, ライトロード・マジシャン ライラ IMPLEMENTED → TESTED (focus registered).
- TESTED 2205 → 2209, IMPLEMENTED 105 → 101.
