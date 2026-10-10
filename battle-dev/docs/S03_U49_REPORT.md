# S03-U49 バトルフェーダー once per chain — real-duel RESPOND_LOOP (Claude)

Base: `checkpoint_claude_s03_u48_vayu_resolution_20260914.zip`, SHA256 `edd24b086f39121739372a4a7ae2a12168b24a51f8b6b848b4a1aaa89cea4471`.

## How it was found

- In the U48 sweep of 【BF】 vs 1103兎ラギア (fixed lists, responder), seed `0x52310501` with player 0 first hit the 120 s harness timeout.
- Rerun with a scratch harness allowing 600 s: `RESPOND_LOOP` at turn 6, Battle Phase, after 4544 ops (380 s).
- The ops repeat one pattern: chain window (player 1) → chain window (player 0, offered バトルフェーダー@hand) → chain response バトルフェーダー on top of バトルフェーダー.

## Diagnosis

- バトルフェーダー's effect Special Summons it from the hand at resolution, so the card stays in the hand while its link is on the chain.
- Its condition only required a pending direct attack from the opponent and a free zone, so the same copy (and any other copy) passed legality again on top of its own link; each activation added a new link with a new chainId, so the responder never saw a repeat.
- Scan of the fixed-list hand effects offered as chain responses (`u49_hand_stay_scan.js`): only バトルフェーダー stays in the hand; 朱光の宣告者, BF－月影のカルート and エフェクト・ヴェーラー move the card as a cost.
- Classification: CARD_WORK on a serious blocker (real-duel stop).

## 2011 source

yugioh-wiki 《バトルフェーダー》 age 55 (2011-08-23):
- a trigger effect at the opponent's direct attack declaration (09/12/01);
- several copies cannot be activated in the same chain (09/12/09); nor together with 《血涙のオーガ》 (09/12/09, not scripted);
- if the Special Summon is negated or the card is not in the hand at resolution, the Battle Phase does not end (09/11/15, 09/12/09).

## Measurement before (U48 build)

- `tools/test_s03_u49_battle_fader_once_per_chain.js`: **6 PASS / 1 FAIL** — with its link on the chain, both hand copies were still offered and legal.

## Closure

- **cards/37 バトルフェーダー:** the condition refuses while a バトルフェーダー link is on the chain (09/12/09).
- **Test** (after U48 in `tools/check.py`), **after: 7 PASS / 0 FAIL**:
  - A: at a direct attack declaration it is offered; it is Special Summoned in defense position, no damage, the Battle Phase ends; Replay ok;
  - B: with its link on the chain, neither copy is offered or legal; one resolves, the other stays in the hand; Replay ok.
- Coverage unchanged (the card was already TESTED).

## Real-duel effect

- **【BF】 vs 1103兎ラギア**, Astra's fixed lists, responder, seeds `0x52310501`–`0x52310507` × both first players, U49 build, run with the 600 s scratch harness: **14 / 14 completed**, Replay ok in all 14, blocker none, unsupported [] (6–26 s per duel).
- Before (U47 / U48 builds, 120 s harness): 11 / 14 — the ヴァーユ stop (fixed in U48) and two harness timeouts; `0x52310501` first 0 was the バトルフェーダー RESPOND_LOOP, and `0x52310506` first 0 now completes too (turn 18), so its timeout was the same loop.

## Gate

- `python tools/check.py` — EXIT 0, **12679 PASS / 0 FAIL**, no Traceback (log `s03_u49_full_gate.log`).
- The two `ReferenceError` lines in the log (c1ElementOnField, isEffectNegated) are pre-existing (also in the U45–U48 logs).

## Source hash

`0fb583d5511ccd6c3da8c9cff892a64310f7d909eeb225830209c6ddc5fe36c7` (724 files, excluding dist/ and *.log; this report set aside).

## Remaining

- The engine still models バトルフェーダー as a quick effect with an attack-declaration timing, not as a trigger at the declaration; the once-per-chain rule covers the observed loop.
- 《血涙のオーガ》 is NOT_STARTED; when scripted, it shares the one-per-chain restriction.
