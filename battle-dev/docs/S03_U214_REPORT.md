# S03-U214 — 「墓地へ送られるカードは墓地へは行かず除外される」 (光の追放者, 閃光の追放者, マクロコスモス, 次元の裂け目)

## Engine — `engine/1ZZG_grave_redirect_s03.js`
- A face-up card on the field whose script declares `graveToBanishS03` replaces every move to a Graveyard: the card goes to its owner's
  banished zone instead. The declaration is `true` for all cards, or `fn(card, src)` for the cards it covers.
- Every GY move in the engine goes through `pushZone` (engine/00), which asks `graveRedirectPileS03`. This covers:
  - destruction, including battle cleanup;
  - effect sends, discards and mills;
  - Tributes and Synchro materials;
  - a Spell / Trap going to the GY after it resolves;
  - equips that lose their target.
- A banished card gets `banishInfo {from:'graveRedirect'}` and an `onRemove` event.
  - It gets no `graveInfo` and no `onSendToGrave`. The nine reducer sites that read "the last GY card" now read it only when it really is
    the card (`graveLastIsS03`).
  - `processEventV27` / `processEventBatchV28` skip an `onSendToGrave` for a redirected card.
  - So 「墓地へ送られた時」 triggers do not activate.
- Which sources apply:
  - Sources are captured when the outermost Action starts (`applyAction`), so cards leaving in one Action are all covered.
  - A source that leaves the field during an effect (for example ブラック・ホール, which destroys the cards one Action at a time) still covers
    the rest of that effect's Actions. These are keyed by the Action's effect-source stamp `a.srcS03` in the same turn
    (`gs.redirectDepartedS03`), so Replay rebuilds them from the same Actions.
  - Unstamped Actions never see a departed source: costs, battle, and the Spell going to the GY after it resolves.
  - The source itself goes to the GY.
  - A negated source, or a Spell / Trap still being activated, does not apply.

## Cards — cards/HZZV_claude_s03_u214_grave_redirect.js (2011 texts)
- 光の追放者, 閃光の追放者 (NOT_STARTED → TESTED): `graveToBanishS03:true` while face-up.
- 次元の裂け目 (ENGINE_GAP → TESTED): a Continuous Spell that covers monsters only. Its ENGINE_GAP override ("zone replacement across every move
  path") is removed because that replacement now exists.
- マクロコスモス (PARTIAL → TESTED): replaces the coarse auto-table recruit.
  - It is a Continuous Trap.
  - When it resolves, 原始太陽ヘリオス may be special summoned from the hand or Deck. This is an optional pick (`minPick:0`), and its pool
    spec stays registered, so `tools/test_s03_u135` still counts it.
  - Then every card is banished instead of going to the GY.

## Tests
`tools/test_s03_u214_grave_redirect.js` passes 18/0, on real DUEL paths and Replay-audited.
- おろかな埋葬: both the Deck card and the Spell are banished.
- キラー・トマト destroyed by battle is banished, and its trigger does not activate.
- ブラック・ホール destroying 光の追放者 and an opponent's monster: the monster is banished, 光の追放者 goes to the GY, and the GY is normal
  afterwards.
- The opponent's 閃光の追放者 applies to the other player's cards.
- 次元の裂け目: the monster is banished and the Spell goes to the GY.
- マクロコスモス: ヘリオス is summoned (ATK 100 from the banished monster), and the pick allows none.

Other checks:
- Negative control on U213: 10 FAIL.
- `tools/test_s03_u04_lock_recovery.js` (save / load) and `tools/test_s03_u135` still pass.

## Follow-up (found by the pre-scan before publication)
`tools/test_v920_batch43.js` checks a reviewed list of ENGINE_GAP overrides. 次元の裂け目 was on that list, so removing its override made the list
check fail. The file's own convention is that a gap that gets implemented moves to an "unlocked" list, which asserts the override is gone
(as with 古代遺跡コードA and the P23 / Class A cards). 次元の裂け目 now moves to `graveRedirectUnlocked`. The count is unchanged at 30.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15517 PASS / 0 FAIL** (= U213 15499 + 18 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U213.
- Coverage: TESTED 2550, ENGINE_GAP 598, NOT_STARTED 1171, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 510 declared, 0 off-target.
