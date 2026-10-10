# S03-U181 — 剣闘獣 stage 2

## Engine
- engine/1ZK `summonOnlyByS03`: also reads 「「X」以外の効果によって、このカードを特殊召喚する事はできない」 (only 剣闘獣スパルティクス /
  アレクサンデル in the 2011 pool) as 「X」の効果でしか特殊召喚できない. The tag-out's candidate list already asks
  `canEffectSpecialSummonS03(card, 'deck', <summoner>)`, so スパルティクス is offered only by ホプロムス and アレクサンデル only by ディカエリィ.

## Cards (→ TESTED)
スパルティクス (闘器 equip search on a Special Summon), アレクサンデル (special-summoned: unaffected by Spell cards), サムニテ (battle
destroy → search, when gladiator-summoned), オクタビウス (set card destruction; discard 1 or return at its Battle Phase end; ENGINE_GAP pin
removed), ゲオルディアス (contact; burn = the destroyed monster's printed DEF; EX tag-out of 2), ガイザレス (contact; ① destroy up to 2
targets on a Special Summon; ② EX tag-out of 2).

## Tests
`tools/test_s03_u181_gladiators2.js` 21/0 (real DUEL paths, Replay-audited). `tools/test_v920_batch43.js`: オクタビウス moved from the
ENGINE_GAP review list to the unlocked list (same assertion count). Negative control on U177: 13 FAIL.

## Left
剣闘獣ダリウス (revive with its effects negated; the revived monster returns to the Deck when ダリウス leaves) and 剣闘獣ラニスタ (banish a GY
「剣闘獣」 and be treated as that name until the End Phase) — their AUTO_DECK_TABLE entries stay PARTIAL. ゲオルディアス's burn uses the
printed DEF (a modified DEF of the destroyed monster is not tracked).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14811 PASS / 0 FAIL** (= U180 14790 + 21 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U180.
- Coverage: TESTED 2320, ENGINE_GAP 599, NOT_STARTED 1216, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 134 (4996); audit 281 declared, 0 off-target.
