# S03-U172 — Player2's saved deck could not be started (user report)

## Report
「player２のデッキがサンプルの兎ラギアしか選ぶことができない。他のデッキを選ぶとデッキが空の状態でデュエルが開始される」 (after confirming U114 / U121 on device).

## Findings
- Loading itself works. The builder's v2 records are read by the same code the U114 test checks with the builder's own storage code. Picking Player2's saved deck records it as the next deck (SET_NEXT_DECK), and `startSelectedDeckDuel` starts both decks. Reproduced on the U121 and U171 builds in the harness.
- The problem is the flow outside the builder launch.
  - Choosing a saved deck only set the next deck and closed the sheet.
  - The home screen (「手札なし」) offered only 「兎ラギアと対戦開始」 (Player2 = the sample) and 「デッキを読み込む」.
  - 「選択デッキで新規デュエル」 existed only inside the hamburger menu.
- So Player2's chosen deck never became a duel. The visible start always used the sample, and advancing phases on the not-started board ran with empty Decks.
- The exact tap sequence on the device was not reproduced step by step.

## Change
- **`data/82_builder_launch_s03.js`**:
  - After a normal selection (`deckSelectAfterLoadS03`, called from `applyLoad` after the builder-flow hook):
    - both players selected → the start confirmation (Player1 / Player2 deck names, 「自分が先攻で開始」 / 「相手が先攻で開始」, re-pick buttons, 「あとで」) → `startSelectedDeckDuel`;
    - only Player1 → 「Player2のデッキを選ぶ」 / 「兎ラギアと対戦開始」;
    - only Player2 → 「Player1のデッキを選ぶ」.
  - Unmatched card names are shown in these screens.
- **`ui/10_render_input.js`**: the not-started home screen shows 「選択デッキで開始」 when both decks are selected, and the selected deck names (escaped).
- The builder launch flow (U121) is unchanged.

## Test — `tools/test_s03_u172_deck_select_start.js` 5/0
Two 40-card decks written by the builder's own storage code (tools/fixtures/deckbuilder_v90_storage.js).
- **A**:
  - Player1 → the next-step prompt; Player2 → the start confirmation with both names;
  - 「相手が先攻で開始」 → both players 35 + 5, Player2 plays デッキB (not the sample, not empty), Player2 first.
- **B**: 兎ラギア is still one tap away.
- **C**: Player2 first → Player1 is asked.
- **Negative control on U171**: 2 FAIL + 1 error.
- The file is listed in NON_CARD_TEST_FILES (its card names are deck contents): no status change.

## Status
No change. TESTED 2285, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 145, ENGINE_GAP 601, NOT_STARTED 1236.

## User decisions recorded
- U114 and U121 confirmed on device.
- Optional destruction substitutes: pause at the destruction and let that player choose. It is implemented next (S03-U173) for 真六武衆－シエン, 六武衆－ザンジ, 六武衆－ヤイチ and ガチガチガンテツ on one common mechanism.
