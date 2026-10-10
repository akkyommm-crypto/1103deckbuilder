# S03-U169 — ナチュル・チェリー / プチトマボー / 素早いムササビ

## Why
Three recruiters left out of S03-U156 because their texts need more than a plain Deck summon.
- プチトマボー and 素早いムササビ had no script (NOT_STARTED).
- ナチュル・チェリー was ENGINE_GAP: its reason was "needs opponent-caused field-to-GY provenance and an optional selection of up to two copies for a face-down Defense summon".

## Engine
- **engine/1ZT**:
  - `spec.summonFlag {key}`: a zone-local turn mark on each monster the effect Special Summons.
  - `spec.toOpponent`: the Special Summon goes to the opponent's field, from the player's Deck; the zone checks use the opponent's field.
- **engine/20** `materialCandidates`: a monster whose `noSynchroMaterialTurnS03` equals this turn is not a Synchro material candidate. The key is zone-local.
- **engine/70** `tributeCandidates`: a script may declare `noAdvanceTributeS03` (「アドバンス召喚のためにはリリースできない」); before, only card flags (羊トークン) were read.
- **P4 overlay**: group TOMABO (「トマボー」: トマボー / プチトマボー). Authority P4-v6 → **P4-v7**; `test_p4_setcode_authority.js` pinned counts are 36 / 486 / 340 / 491, with the reason recorded (102/102).

## Cards (`cards/HZO_claude_s03_u169_deck_triggers3.js`)
- **ナチュル・チェリー**:
  - a field→GY trigger, only when sent there by the opponent: battle with the opponent's monster (`graveInfo.byPlayer`), or an effect of the opponent (P3 move provenance);
  - optional; up to 2 copies in face-down Defense Position.
- **プチトマボー**: a battle trigger, optional. Up to 2 「トマボー」 monsters are Special Summoned, marked as no Synchro Material this turn.
- **素早いムササビ**:
  - a battle trigger, forced: 500 damage to the opponent;
  - then any number of copies (0 allowed) to the opponent's field in face-up Attack Position;
  - it is not a Tribute candidate for an Advance Summon.

## Test — `tools/test_s03_u169_deck_triggers3.js` 11/0 (real DUEL path; Replay-audited)
- **A ナチュル・チェリー**:
  - the opponent's サンダー・ボルト → 2 copies face-down Defense;
  - its controller's own ブラック・ホール → no trigger;
  - battle with the opponent's monster → offered.
- **B プチトマボー**: only トマボー / プチトマボー are offered, not ワイト; both are summoned, carry the turn mark, and are not Synchro material candidates.
- **C 素早いムササビ**: forced 500 damage; the choice is min 0 / max 2; 2 copies land face-up Attack on the opponent's field; it is not a Tribute candidate.
- **Negative control on U168**: 5 FAIL.
- `test_v860_batch37.js`: ナチュル・チェリー moved from its ENGINE_GAP list to an "unlocked" list, following the test's own convention (count unchanged).
- The override was removed.

## Status
- ENGINE_GAP → TESTED: ナチュル・チェリー.
- NOT_STARTED → TESTED: プチトマボー, 素早いムササビ.
- Totals: TESTED 2283, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 145, ENGINE_GAP 602, NOT_STARTED 1237.
