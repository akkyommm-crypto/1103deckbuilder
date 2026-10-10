# S03-U255 — LV monsters 2: アルティメット・インセクト, 漆黒の魔王 LV6 / LV8, アームド・ドラゴン LV5 / LV7 / LV10, 異次元の狂獣

## Workflow
- opus-only, because it is engine work. Two of the ten cards were ENGINE_GAP:
  - アルティメット・インセクト LV7: special-summon provenance. The S03-U238 `summonSrcS03` record already existed; the LV-up helpers just did not pass it.
  - 異次元の狂獣: no destroyer-side battle banish.
- The tree was built on U253 while U254 ran, then rebased onto U254 (`rebase_unit.py`).

## Engine (engine/00 BATTLE_CLEANUP, engine/1S)
- `card.battleKillEffectTurnS03` (zone-local): the destroyer still in the Monster Zone destroyed an effect monster this turn. Used by 漆黒の魔王 LV6's 「この効果で相手モンスターの効果を無効化した」.
- **Battle-victim banish.** When the destroyer is face-up, its effect is not negated, and its script's `battleVictimBanishS03(destroyer, victim)` returns true, the victim is banished instead of going to the GY. Used by 漆黒の魔王 LV8 and 異次元の狂獣.
- **Negation reaches banished victims.** A declared battle-destroyed negator (engine/1S) now also reaches a victim banished that way: `banishInfo.battleNegatorUidS03`, checked at resolution when the card is in the banished zone.
- **「「X」の効果で特殊召喚した場合」.** The shared LV-up helper (S03-U251) and 漆黒の魔王 LV4 (cards/B4) now pass `opts.summonSrcS03`, so the summoned card records which card summoned it.

## Cards → TESTED (2011 texts) — cards/HZZZZI_claude_s03_u255_lv2.js
- アルティメット・インセクト:
  - LV1: unaffected by Spells.
  - LV1 → LV3 → LV5 → LV7: at each own Standby Phase, except on the turn the card was summoned, special summoned or flipped.
  - Opponent monsters lose ATK only when the card was summoned by the previous LV: LV3 −300 ATK, LV5 −500 ATK, LV7 −700 ATK / DEF. LV7's ENGINE_GAP override was removed.
- 漆黒の魔王:
  - LV6 (summoned by LV4) negates the effect monsters it destroys by battle. At the next own Standby Phase after doing so, → LV8.
  - LV8 (summoned by LV6) banishes and negates what it destroys by battle.
- 異次元の狂獣: what it destroys by battle is banished. ENGINE_GAP override removed.
- アームド・ドラゴン:
  - LV5 ①: send a hand monster (cost; its ATK is recorded with a journaled flag) → destroy a face-up opponent monster with ATK ≤ that.
  - LV5 ②: battle-kill turn's End Phase → LV7.
  - LV7: summoned only by LV5 (engine/1ZK); ① destroys all opponent monsters with ATK ≤ the sent monster's ATK.
  - LV10: summon procedure from the hand by releasing an own LV7; discard 1 → destroy all opponent face-up monsters.

Rulings chosen:
- アームド・ドラゴン LV5 targets only face-up monsters, whose ATK is known. LV7 compares face-down monsters by their ATK too.
- A printed '?' ATK counts as 0.
- 漆黒の魔王 LV6's "next own turn" is the first own turn after the kill (≤ +2 turns).

## Existing tests adjusted (status records; no behavior assertion changed)
`tools/test_v640_batch16.js` listed アルティメット・インセクト LV7 as a precise ENGINE_GAP. It moves to the 「Existing engine unlocked」 list, and the count (47) is unchanged.

## Tests
`tools/test_s03_u255_lv2.js` passes 33/0, on real DUEL paths and Replay-audited.
- A: the full Insect chain LV1 → LV7 with the stat checks, the summon-turn negative, a no-provenance control, and LV1 vs ブラック・ホール.
- B:
  - LV4 → LV6;
  - LV6 negates キラー・トマト's effect (nothing summoned), then → LV8;
  - LV8 banishes キラー・トマト;
  - controls without provenance: キラー・トマト summons ワイト, and ワイト goes to the GY.
- C: 異次元の狂獣 banishes ワイト.
- D:
  - LV5 ①, plus a not-activatable negative;
  - LV5 → LV7 at the End Phase;
  - LV7 ① with ATK ≤ 2000, including the face-down monster;
  - LV10 procedure and effect (face-up only);
  - LV10 not legal without LV7; LV7 not summonable by another effect.

Negative control on U254: 18 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16604 PASS / 0 FAIL** (= U254 16571 + 33 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U254.
- Coverage: TESTED 2784, ENGINE_GAP 567, NOT_STARTED 968, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 745 declared, 0 off-target.
