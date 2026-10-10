# S03-U217 — NOT_STARTED 9

## Engine
- `engine/1ZD` `monsterActivationLockReasonS03`, read by `activationTypeLockReasonS03`, so every legality consumer sees it.
  - A face-up, non-negated monster whose script declares `activationLockS03(info)` forbids the card activation that `info` describes.
    `info` = {p (activating player), card, zone, db, src, srcPlayer}.
  - Only card activations are locked: from the hand, a set card, or `opts.cardActivation`.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZY_claude_s03_u217_ns9.js
- かつて神と呼ばれた亀: neither player can special summon a monster with 1800 or more ATK. It uses `specialSummonLockS03` (S03-U211).
- マジシャンズ・ヴァルキリア: the opponent cannot choose the controller's other face-up Spellcasters as attack targets (`cannotBeAttackTarget`, ownMonsters).
- ヒエラコスフィンクス: the opponent cannot choose face-down Defense monsters as attack targets.
- 闇竜の黒騎士: once per turn → special summons, to its own field, a targeted Level 4 or lower Zombie from the opponent's GY that was destroyed by
  battle.
- 魔轟神獣コカトル: when it destroys a monster by battle and sends it to the GY → discard a 「魔轟神」 monster (cost) → draw 1.
- ミラージュ・ドラゴン: the opponent cannot activate Trap cards in the Battle Phase.
- メカニカル・ハウンド: while its controller's hand is empty, the opponent cannot activate Spell cards.
- フォトン・ケルベロス: in the turn it was Normal Summoned, while it is face-up, neither player can activate Trap cards.

## Existing test adjusted
`tools/test_auto_cycle21.js` listed かつて神と呼ばれた亀 among cards with "no consumer in the engine" (a SKIP assertion: no script). The consumer has
existed since S03-U211, and this unit adds the script. The assertion now checks that the script and its consumer exist, in the same way as
D.D.チェッカー in S03-U211. The count is unchanged at 74.

## Tests
`tools/test_s03_u217_ns9.js` passes 20/0, on real DUEL paths and Replay-audited.
- Attack requests on protected monsters are refused.
- 死者蘇生 skips 青眼 under the 亀.
- 闇竜の黒騎士 picks only the battle-destroyed Zombie.
- コカトル discards, then draws.
- Each lock is checked both where it applies and where it doesn't: phase, hand count, summon turn, the controller's own cards.

Negative control on U216: 13 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15572 PASS / 0 FAIL** (= U216 15552 + 20 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U216.
- Coverage: TESTED 2568, ENGINE_GAP 598, NOT_STARTED 1153, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 528 declared, 0 off-target.
