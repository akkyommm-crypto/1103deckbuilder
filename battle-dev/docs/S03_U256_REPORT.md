# S03-U256 — LV monsters 3: ミスティック・ソードマン LV4 / LV6, サイレント・マジシャン LV4, 進化する翼, ハネクリボー LV10

## Workflow
- opus-only, because it includes a small engine change.
- 進化する翼 was ENGINE_GAP. Its reason (the summon condition of ハネクリボー LV10) has been engine/1ZK 「でのみ」 since S03-U251.
- Built on U255. The tree was re-created from the rebased U255 and its changes reapplied (one engine block and a new card file).

## Engine
- `FX_TO_GRAVE` with `deckTopInsteadS03:true` (destruction): the card is destroyed, then placed on top of its owner's Deck instead of the GY. This is the same placement as the S03-U110 replacement (`returnToOwnerDeckOrExtra`, top).
- Used by ミスティック・ソードマン LV6: 「この効果で破壊したモンスターを墓地へ送らず、相手のデッキの一番上に置く事ができる」.

## Cards → TESTED (2011 texts) — cards/HZZZZJ_claude_s03_u256_lv3.js
- **ミスティック・ソードマン LV4:**
  - Normal Summon only as a Set: System v23 `normalSummonProcedure` with modes ['set'].
  - It destroys an attacked face-down Defense monster face-down, without damage calculation, as LV2 does (cards/B4).
  - At the End Phase of a turn it destroyed a monster: → LV6.
- **ミスティック・ソードマン LV6:** Set only (1 Tribute). The same face-down destruction, with an option to place the monster on top of the opponent's Deck.
- **サイレント・マジシャン LV4:**
  - It gets one Spell Counter per card the opponent draws (onDrawCard, forced, max 5) and +500 ATK per counter.
  - At the next own Standby Phase after the 5th counter: → LV8. LV8's 「でのみ」 condition allows LV4's effect.
- **進化する翼** (ENGINE_GAP override removed): cost: an own 「ハネクリボー」 and 2 hand cards → 「ハネクリボー LV10」 from the hand / Deck.
- **ハネクリボー LV10:**
  - Only 進化する翼 summons it.
  - In the opponent's Battle Phase it can release itself to destroy the opponent's Attack Position monsters and burn their total original ATK.

Rulings chosen:
- The Spell Counter effect follows the codebase's 「…する度に」 cards: a forced trigger, one per card drawn.
- ハネクリボー LV10's damage counts only the monsters actually destroyed (original ATK, printed; '?' = 0).
- 「次の自分ターン」 means the first own turn after the record.

## Existing tests adjusted (status records; no behavior assertion changed)
`tools/test_v810_batch32.js` had two status checks on 進化する翼: a precise ENGINE_GAP check and the "activation-time" wording of its reason.
- They become two unlocked checks: no override, and a script exists.
- The count (73) is unchanged.

## Tests
`tools/test_s03_u256_lv3.js` passes 25/0, on real DUEL paths and Replay-audited.
- Mystic:
  - Set only (LV4: no Tribute; LV6: 1 Tribute);
  - face-down destruction, checked as destroyed face-down (`graveInfo.face`) with no damage;
  - End Phase LV-up, and none without a kill;
  - LV6's Deck-top and GY choices.
- サイレント・マジシャン LV4: 2 counters from the opponent's 強欲な壺, none from its controller's own; capped at 5 with ATK 3500; LV-up to LV8.
- 進化する翼 → LV10:
  - LV10 at the opponent's attack declaration (`pointActivateV27`): 5000 damage, the Defense Position monster stays;
  - not activatable in its controller's own turn;
  - not summonable by another effect.

Negative control on U255: 13 FAIL. Two face-down checks were strengthened after a first control showed that a normal battle also destroys the face-down monster.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16629 PASS / 0 FAIL** (= U255 16604 + 25 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U255.
- Coverage: TESTED 2789, ENGINE_GAP 566, NOT_STARTED 964, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 750 declared, 0 off-target.
