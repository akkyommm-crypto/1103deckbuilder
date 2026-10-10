# S03-U121 — deck builder launch flow (user request) + effect Synchro Summon + TG / Synchron cluster

## Part 1 — user request: 「このデッキでデュエルする」 (`?from=builder`)
The deck builder (index.html) now saves the deck being edited (`currentDeckRecord()`: `{id, name, cards, side,
candidates, memo}`, cards/side mostly `{n, q}`) to `sessionStorage["duel1103:launchDeck"]` and opens
`battle.html?from=builder`. Added in `data/82_builder_launch_s03.js` plus three small hooks; rule engine, card scripts
and board processing are unchanged.
1. `from=builder` detected at startup (plain query parse, no URLSearchParams dependency).
2. The sessionStorage deck is read and deleted; `from=builder` is removed from the URL (`history.replaceState`) so a
   reload does not repeat the flow.
3. Player1 is set through the existing loader only: `normalizeSavedDeckEntry` → `applySavedDeckS03` → `applyLoad`
   (`SET_NEXT_DECK`, keeps id / name / side; unknown card names are excluded and listed, as before).
4. The existing Player2 deck selection (`openDeckLoad('saved', 1)`) opens automatically (after the unknown-card list,
   if any, via a 「Player2のデッキを選ぶ」 button).
5. After Player2 is chosen (saved deck / text / the 兎ラギア row), a confirmation shows 「自分が先攻で開始」
   「相手が先攻で開始」 (also 「Player2のデッキを選び直す」, 「やめる」) and calls the existing start
   (`startSelectedDeckDuel(fp)` / `startRabbitOpponentDuel(fp)` for 兎ラギア).
6. `runtime/90_boot.js`: with `from=builder` the flow runs instead of the 「前回のデュエル…再開しますか？」 prompt. The
   saved duel is not deleted by the flow; only starting a new duel replaces it (existing behavior).
7. Normal direct launch: unchanged (`builderLaunchS03()` returns false → `offerResumeDuel()`); `from=builder` without a
   deck or with broken JSON → a toast and the normal startup.
- Hooks: boot branch; `applyLoad` calls `builderLaunchAfterLoadS03(p, missing)` only while the flow is active; the
  兎ラギア row calls `rabbitRowPickS03()` (outside the flow it starts immediately, as before).
- Test `tools/test_s03_u121_builder_launch.js` 15/0 (A: full flow incl. SET_NEXT_DECK journal, key deletion, P2 list,
  confirmation, P2 first; B: 兎ラギア row → confirmation → P1 first; C: normal launch unchanged, missing / broken data
  fallbacks, 兎ラギア row outside the flow). Loader-related tests re-run: 22 files, 0 FAIL.
- Real-browser acceptance (local server, same origin; a stand-in page doing exactly what the builder does, because the
  updated builder is not on this machine): `?from=builder` with a saved duel present → no resume prompt; P1 = the
  builder deck (13+1, the unknown card listed, id/side kept, key deleted, URL cleaned, saved duel kept) → P2 list →
  「P2テストデッキ」 → confirmation → 「相手が先攻で開始」 → duel started with P2 first, 5-card hands; second run with the
  兎ラギア row and 「自分が先攻で開始」 → P1 first vs 40+15; direct `battle.html` → the resume prompt path runs as before;
  `?from=builder` without data → toast + normal startup. Re-checked on the final build.

## Part 2 — effect Synchro Summon + TG / Synchron cluster
Measured on U120:
- フォーミュラ・シンクロン: ① fired on any Special Summon (a 死者蘇生 revive drew a card); ② (Synchro Summon during the
  opponent's Main Phase) did not exist.
- TG ワンダー・マジシャン: ① optional and without an explicit "this card" check; ② did not exist; ③ was not a trigger
  (only manual activation from the GY in the turn it was destroyed).
- TG ハイパー・ライブラリアン: drew even if it had left the field before resolution.
- TG パワー・グラディエイター: no piercing; draw not a trigger (manual GY activation only).
Changes:
- `engine/1ZJ_effect_synchro_s03.js`: Synchro Summon by an effect at resolution — choose a Synchro Monster whose legal
  combination (exCombos) includes this card, the combination and the position (registered ChoiceRequest handlers,
  uid-based), re-validated, then `EX_SUMMON_PREPARE_V42` + `EX_SUMMON_COMMIT_V42` (a real Synchro Summon; no negation
  window during resolution; "S召喚に成功した" triggers after the chain).
- Scripts rewritten in place (`cards/10_themes_a.js`, `cards/30_themes_b.js`) with eventName dispatch; ① / ③ mandatory
  where the text says 発動する; `timing:['free']` for the two quick-effect cards (conditions enforce the opponent's Main
  Phase), otherwise scriptTimings() would infer only 'summon'.
- Test `tools/test_s03_u121_tg_synchro.js` 28/0 (real DUEL path, Replay-audited): A フォーミュラ ② in response to P2's
  サイクロン → 氷結界の龍 ブリューナク; B ① draw on Synchro Summon, none on revive; C ライブラリアン draws / not after being
  destroyed in response; D ワンダー・マジシャン ①/③/② (スターダスト・ドラゴン); E パワー・グラディエイター piercing + draw.
- Negative control on U120: A, B(revive), C(left), D ②/③, E fail. Related tests re-run (51 files): 0 FAIL.
- Engine limitation noted (not changed): the non-turn player has no open-state quick-effect window during the turn
  player's Main Phase; ② is usable in response windows (chains, POINTs).

## Status
- フォーミュラ・シンクロン, TG ワンダー・マジシャン, TG ハイパー・ライブラリアン, TG パワー・グラディエイター
  IMPLEMENTED → TESTED. TESTED 2180 → 2184, IMPLEMENTED 113 → 109.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 13855 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `db90e5bd440cfa7cf301d0f53cc1b1f98e77e50acf99d017046bab084e5eef29` (the build verified in the
  browser); **Acode regenerated** after the gate: `dist/battle_acode.html`
  `8fe063b7610300355bb94270ecfd26a25a5385308c3d0f548da71c51ed26d970` (4996 cards embedded).
- Coverage: TESTED 2184, IMPLEMENTED 109, ENGINE_GAP 609, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1278 (4996);
  139 declared status changes, 0 off-target.
