# S03-U208 — NOT_STARTED 1 (ラヴァルの炎車回し, ナチュル・マロン, スクラップ・コング, 貫ガエル)

## Engine
FX_TO_GRAVE records the effect source in `graveInfo.srcUidS03`. The value comes from the source stamp the Action already carries
(`srcS03`, S03-U115). This supports 「「X」と名のついたカードの効果によって破壊され墓地へ送られた場合」 (スクラップ・コング).

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZP_claude_s03_u208_ns1.js
- ラヴァルの炎車回し: an optional trigger when destroyed by battle. It sends 2 「ラヴァル」 monsters from the Deck to the GY.
- ナチュル・マロン:
  - ① an optional trigger on its Normal Summon: a 「ナチュル」 from the Deck to the GY;
  - ② once per turn, targets 2 「ナチュル」 in the GY → returns them to the Deck, then draws 1.
- スクラップ・コング:
  - forced self-destruction on its Normal Summon;
  - when destroyed by a 「スクラップ」 card effect (its own counts), a 「スクラップ」 other than コング from the GY to the hand.
- 貫ガエル: can attack directly. On its direct battle damage, while another 「ガエル」 is on the field, it may destroy a targeted opponent
  Spell / Trap.

## Tests
`tools/test_s03_u208_ns1.js` 11/0 (real DUEL paths, Replay-audited). The negative case: コング destroyed by ブラック・ホール does not
activate. Negative control on U207: 6 FAIL.

## Follow-up (found by the pre-scan before publication)
`tools/test_s03_u04_lock_recovery.js` failed "VM2 final digest equals VM1 continuation". A game saved during a resolution choice (水晶の占い師)
and loaded in a new VM resumed without the resolving chain link (`RESOLVING_LINK_S03`, a module variable). The resumed FX_TO_GRAVE then had no
`a.srcS03`, so the new `graveInfo.srcUidS03` differed from the live run. Fix (engine/1R, engine/09):
- `beginLinkResolutionS03` / `endLinkResolutionS03` mirror the link in `gameState.resolvingLinkS03`, which is not part of the digest;
- `reconcileChoiceAfterLoadV49` (every load path) restores it.

The resumed actions now carry the same source stamp as the live run. The same gap had affected the U115 「効果を受けない」 check after a load.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15388 PASS / 0 FAIL** (= U207 15377 + 11 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U207.
- Coverage: TESTED 2515, ENGINE_GAP 599, NOT_STARTED 1204, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 31 (4996); audit 475 declared, 0 off-target.
