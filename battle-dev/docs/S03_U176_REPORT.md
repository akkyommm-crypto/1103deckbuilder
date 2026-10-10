# S03-U176 — contact-fusion cards with their whole texts

## Engine (engine/1ZX_hand_destroy_random_s03.js)
- `HAND_DESTROY_RANDOM_S03 {player, byPlayer, reason}` + `destroyRandomHandCardS03(victim, reason, byPlayer)`: 「相手の手札をランダムに1枚
  選んで破壊する」 — the random index is drawn inside the Action with the state's RNG (Replay destroys the same card). The card goes to
  its owner's GY as destroyed from the hand (graveInfo byDestroy, from 'hand'); it is not a discard (no discard event); onSendToGrave.
- Script flag `noGraveSpecialSummonS03` (「このカードは墓地からの特殊召喚はできない」): read with the other summon conditions
  (engine/1ZK `properlySummonedReasonS03` → candidate lists and `API.specialSummon`); 「召喚条件を無視して」 still ignores it.

## Fix (found while testing)
- Contact fusion 「デッキに戻す」 left the materials on top of the Deck (FX_RETURN_DECK places a card on top; the U174 report wrongly said
  they were shuffled). The procedure now shuffles each owner's Deck after returning them (SHUFFLE Action, RNG inside the Action).

## Cards (all NOT_STARTED → TESTED)
| Card | Text implemented |
|---|---|
| E・HERO アクア・ネオス | contact fusion; 1/turn discard 1 → random opponent hand card destroyed; End Phase return |
| E・HERO マリン・ネオス | contact fusion; 1/turn random opponent hand card destroyed (no cost; the text has no End Phase return) |
| XY－ドラゴン・キャノン | contact (banish); no Special Summon from the GY; discard 1 → destroy a face-up Spell / Trap (target) |
| XZ－キャタピラー・キャノン | contact (banish); no GY Special Summon; discard 1 → destroy a set Spell / Trap (target) |
| YZ－キャタピラー・ドラゴン | contact (banish); no GY Special Summon; discard 1 → destroy a face-down monster (target) |
| XYZ－ドラゴン・キャノン | contact (banish); no GY Special Summon; discard 1 → destroy any opponent card (target) |
| VW－タイガー・カタパルト | contact (banish); discard 1 → change an opponent monster's position; a face-down one turns face-up Attack without its flip effect |
The cannons / VW have no once-per-turn limit (their texts have none). Discarding is a cost (not 「効果で捨てられた」).

## Tests
`tools/test_s03_u176_contact2.js` 20/0 (real DUEL paths, Replay-audited): A アクア・ネオス (contact — the Deck is shuffled after the
materials return —, random destruction of 1 of 3, 2nd
activation refused, End Phase return); B マリン・ネオス (no cost, 1/turn, stays after the End Phase); C XYZ (X / Y / Z banished, a set
card then a monster destroyed, one discard each); D XY / XZ / YZ offer only their kind of target; E VW (メタモルポット face-up Attack,
no flip effect; then Defense); F the cannon in the GY cannot be revived (candidate check and `API.specialSummon`), VW can.
Negative control on U175: no scripts (A / B fail).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14737 PASS / 0 FAIL** (= U175 14717 + 20 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U175.
- Coverage: TESTED 2299, ENGINE_GAP 601, NOT_STARTED 1227, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 142 (4996); audit 260 declared, 0 off-target.
