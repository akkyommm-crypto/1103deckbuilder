# S03-U46 C-S03-37 SHARED_USE_AND_SPECIAL_SUMMON_EFFECT_LINK — 王宮の弾圧 (Claude)

Base: `checkpoint_claude_s03_u45_legacy_choice_picked_db_20260913.zip`, SHA256 `e4532f82396f8598068d89c285bb9b990c50901c02a91399fcc0a11955e72d0a`.

## Why this unit

- After U45, 六武衆 vs 1103兎ラギア completed 14 / 14. Its only unsupported action was 王宮の弾圧 as a manual-only set activation (seed `0x52310305`, first 1, turn 8).
- 王宮の弾圧 was ENGINE_GAP and is in 5 of Astra's 13 fixed lists (six, jurrac, bf, tg_skill, worm): the most-shared ENGINE_GAP in the major decks.
- Classification: ENGINE_MISSING (opponent may use the effect) + INTEGRATION_MISSING (Special Summon effects that 神の警告 could not see).
- The shared-use part has one consumer in the 4996 pool. It is accepted under the major-deck exception (a unique requirement of a card in 5 major decks).

## 2011 source

yugioh-wiki 《王宮の弾圧》 age 42 (2011-08-28 07:53):
- The card activation is free chain and pays no LP. From a set position it can negate a Special Summon in the same chain link.
- It is used only chaining directly to the Special Summon or to the activation that includes it (08/08/09, 08/07/27).
- A face-up copy may use the effect several times in one chain; a copy flipped by a card activation in this chain cannot use it at a higher link.
- Neither the card nor the effect can be used in the Damage Step. It negates the effect, not the activation.
- 死者蘇生 is destroyed on the field (11/08/27). A summon-rule Special Summon is negated and the monster destroyed off the field (11/08/07).
- The user pays 800 and may use it against their own summon (09/03/15).
- Effects of a Special Summon card other than its Special Summon effect cannot be answered (09/04/15). For Continuous / Field Spells only the effect activation that Special Summons (09/07/06).
- Synchro / Xyz Summons are Special Summons.

## Measurement before (U45 build)

- 王宮の弾圧 had no script: `getLegalZoneActions` offered `activateSetManual` and no response or summon-window candidate.
- 神の警告 read only `includesSpecialSummon===true`. In the six and rabbit lists, 真六武衆－カゲキ, 六武衆の荒行, 諸刃の活人剣術, レスキューラビット and スクラップ・ドラゴン ② Special Summon without declaring it, and 六武の門 declared it for all modes (scan `u46_ss_decl_scan.js`).

## Closure

- **New `engine/1ZC_shared_use_ss_negation_s03.js`:**
  - `specialSummonEffectLinkS03(link)` plus a declaration table;
  - `sharedUseResponseCandidatesS03`, `sharedUseSummonNegatorsS03`;
  - `inDamageStepS03`.
- **engine/30:**
  - chain responses and summon negators add the opponent's face-up `sharedUseS03` cards (`ownerS03`);
  - `duelActivateResponseV2` / `pointActivateV27` / `activateSummonNegatorV2` accept the owner;
  - `prepareDuelActivation(opts.zoneOwnerS03)` reads the card from the owner's zone;
  - the UI rows show 「相手の」.
- **engine/00:** `CHAIN_ADD` writes `zoneOwnerS03` only when set, so existing digests are unchanged.
- **engine/20:** `onFieldEffectS03` offers a face-up effect without making the set activation card-only.
- **cards/00 神の警告:** reads `specialSummonEffectLinkS03`. Card-activation-only links are no longer answered.
- **New `cards/H9_claude_s03_u46_royal_oppression.js`:**
  - 王宮の弾圧: summon window for procedure / synchro / xyz; chain negation (mode effect) plus destroy where the card is; the user pays 800; refusals as in the source;
  - declarations: カゲキ, 荒行, 諸刃, レスキューラビット, スクラップ・ドラゴン (onDestroy), 六武の門 (m6).
- **tools/test_v630_batch15.js:** 王宮の弾圧 moves from the batch15 `gaps` list to the `s03U46Unlocked` record (the first full gate run stopped there: `FAIL precise ENGINE_GAP 王宮の弾圧`, as for 六武院 in U14 and カオス・マジシャン in U32).
- **tools/r1_duel_driver.js:** passes the owner. **build_manifest.json:** the two new files.
- **data:** the 王宮の弾圧 ENGINE_GAP override is removed. Status changes: 王宮の弾圧 ENGINE_GAP → TESTED, 神の警告 IMPLEMENTED → TESTED.
- **Test `tools/test_s03_u46_royal_oppression.js`** (after U45 in `tools/check.py`), 26 PASS / 0 FAIL:
  - A: set copy negates サイバー・ドラゴン's procedure;
  - B: the opponent uses the summoner's face-up copy (user pays, link belongs to the user);
  - C: 死者蘇生 effect negated, destroyed;
  - D: the opponent uses a face-up copy against 六武衆の荒行; no reuse on top;
  - E: 神の警告 answers 荒行;
  - G: エヴォルカイザー・ラギア's Xyz Summon negated;
  - F: refusals (nothing to answer, サイクロン, 700 LP, Damage Step) and the scripted set activation.
  - Replay reproduces every digest in A–E and G.
- **Found during the unit:** Synchro / Xyz Summons also wait in the summon-negation window (`beginExSummonV2`); the first draft covered only procedures, and case G was added.
- **Targeted regressions on the final build:** raiou summon window 16 / 0, U15 24 / 0, U16 18 / 0, U17 20 / 0, VS3 six gate slice 22 / 0, U44 9 / 0, U45 9 / 0, R1 gate 44 / 0.

## Design choices with no 2011 ruling found

- A set copy activated while an answerable Special Summon is pending uses the effect when its user can pay 800 (a player can still activate it card-only when nothing is answerable).
- Summon negators are still offered to the non-summoning player only (the 09/03/15 own-summon use is not offered).
- A negated Synchro / Xyz Summon follows the existing `EX_SUMMON_CANCEL_V42` contract (monster and materials to the GY), as for 神の警告.

## Real-duel effect

- 六武衆 (six) vs 1103兎ラギア, Astra's fixed lists, responder, seeds `0x52310301`–`0x52310307` × both first players, final build: **14 / 14 completed**, Replay ok in all 14, blocker none, **unsupported [] in all 14** (U45: 14 / 14 with 王宮の弾圧 manual-only at `0x52310305` first 1).
- In `0x52310305` first 1 the 六武衆 player set 王宮の弾圧 (turn 6) and activated it as a free-chain card activation on top of its own 強制脱出装置 (turn 7; no LP paid, nothing to answer); that duel now ends on turn 10 (loser 1, LP 0) with Replay ok.
- No sweep duel negated a summon with it; the negation paths are covered by the DUEL-path test.

## Gate

- `python tools/check.py` — EXIT 0, **12648 PASS / 0 FAIL**, no Traceback (log `s03_u46_full_gate.log`).
- A first run stopped at `tools/test_v630_batch15.js` (`FAIL precise ENGINE_GAP 王宮の弾圧`); after recording it as unlocked, the full gate was rerun from the start.
- The two `ReferenceError` lines in the log (c1ElementOnField, isEffectNegated) are pre-existing and also in the U45 log.

## Source hash

`93113134c7a363da7a2934f56c025403df1a1071294edd5a669cff01c14da2ae` (715 files, excluding dist/ and *.log; this report set aside).

## Remaining

- Scripts outside the six / rabbit lists that Special Summon without the declaration are not audited yet (next: the other fixed lists).
- No sweep duel negated a summon with 王宮の弾圧 (only a free-chain card activation); the negation is covered by the DUEL-path test.
