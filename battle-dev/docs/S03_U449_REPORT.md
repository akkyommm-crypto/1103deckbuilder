# S03-U449 - ChatGPT independent audit: 破壊輪 / 連鎖爆撃 / 皆既日蝕の書 / サイバネティック・ヒドゥン・テクノロジー

Base: `claude/work` `80ba808` (U448, gate 21771 PASS / 0 FAIL). Sonnet 5.5, single writer. Branch `claude/work` only; no push to `main`, no merge, no publication.

Scope rule used: the 2011-03 limits and the card pool up to 2011-08-31, with the card texts / rulings of that time. Later errata were not imported. Sources are the
`yugioh-wiki.net` card pages (read in the built-in browser, including their 'エラッタ前のテキスト' sections) and the 2011 wiki backups already in the repository
(`wiki-rulings.js`, `backupDate` 2011-xx). Where a source was not conclusive, the point is listed under "unresolved".

Failing reproduction first: `tools/test_s03_u449_audit_fixes.js` was run on the unfixed code (U448; first version of the file): 20 FAIL lines (破壊輪 x12 incl. the Replay audits of the broken scenarios, 連鎖爆撃 x3, サイバネ x4; the 日蝕 'chain' Replay mismatch was a fixture mistake of the test - `activePlayer` changed after the baseline - and was corrected in the test, the Book itself was already right). After the fix (and the extra cases added meanwhile): 49 / 49 PASS.

## ① 破壊輪 - the audit was correct

- Cause: S03-U349 implemented the 2015 errata text (carddata.json holds the current wording): opponent's turn only, opponent's monsters only, ATK <= opponent LP, once per turn by name,
  original ATK, self damage first (loss before the opponent's damage).
- 2011 text (yugioh-wiki 《破壊輪》, 'エラッタ前のテキスト'): Normal Trap 「フィールド上に表側表示で存在するモンスター1体を破壊し、お互いにその攻撃力分のダメージを受ける。」
  Differences from the current text listed by the wiki: no once-per-turn-by-name limit; activatable in my own turn; my own monsters can be targeted; monsters with ATK above the opponent LP can be destroyed;
  the damage is the ATK as changed on the field; the destruction and the damage to both players are simultaneous (another effect reducing one player's damage does not change the other's).
  Further 2011 rulings (wiki backups): it targets (黒曜岩竜 ruling 08/03/19); an ATK 0 monster can be targeted; no damage when the destruction fails (スタンピング・クラッシュ FAQ 2011-08-13);
  the damage is taken when the monster is no longer on the field (マテリアルドラゴン ruling 08/09/16; 波動竜騎士 10/05/07: destruction and damage are the same timing).
- Fix: `cards/HZZZZZZZK_claude_s03_u349_event_traps.js` (破壊輪 rewritten: any face-up monster, current ATK read before the destruction, `API.afterDestroyS03` continuation 's03u449.ring' so a destruction substitute
  / failed destruction gives no damage). Engine: `engine/00_state_actions.js` LP Action - new flags `simulHoldS03` / `simulFinalS03` bracket one simultaneous damage of both players (both at 0 LP → a draw
  `loser = -1`, `duelEndedReason = 'draw'`; one → that player loses; actions without the flags are unchanged); `engine/40_legal_script_engine.js` `API.damageLP(p, amount, reason, opts)`.
- Existing tests changed (reason: they asserted the 2015 errata): `tools/test_s03_u349_event_traps.js` - 'ATK above their LP → not activated' and 'own turn → not activated' are now positive cases (comments in the file).
- New tests (`tools/test_s03_u449_audit_fixes.js`): own turn, opponent turn, own monster as target, ATK above the opponent LP (they lose), both at 0 → draw, only my LP 0 → I lose, two copies in one turn,
  changed ATK (3500), ATK 0, face-down not targetable, a rule preventing MY effect damage leaves the opponent's damage, destruction substitute used → no damage, declined → both take 1300; Replay audits.
- Result: PASS. Unresolved: none for the text; the deck-building restriction (Forbidden in the 2011-03 list) is untouched.

## ② 連鎖爆撃 - the audit was correct

- Cause: the cost step stored the number of links already on the chain; the card itself was not counted (chain 2 gave 400).
- 2011 basis: yugioh-wiki 《連鎖爆撃》 FAQ and the 2011-03-28 backup in `wiki-rulings.js`: 「チェーンブロック3で発動された場合は1200 (=3x400)」 - the activation count includes the card itself; chain 1 cannot be used (ruling 09/08/18).
- Fix: `cards/HZZZZZZZP_claude_s03_u354_chain.js` (`(gameState.chain||[]).length + 1`). Existing test changed: `tools/test_s03_u354_chain.js` 400 → 800 (comment with the reason).
- New tests: chain 2 → 800, chain 3 (mine at 2, the opponent's at 3) → 800 to the opponent and 1200 to me, chain 4 with 一陣の風 as link 3 → 1600; Replay audits. Result: PASS.

## ③ 皆既日蝕の書 - the suspicion was not confirmed; no engine change

- The script says `type:'spell', priority:1` (like ~20 other Quick-Play Spells written before), but the DUEL engine takes the Spell Speed and the 'from hand in my turn only / from the Set position in either turn'
  rules from `db.sub === '速攻'` (`scriptSpellSpeed`, `isQuickFromZone`, `strictScriptLegalityV2`), not from the script priority. Measured: the chain link of the Set Book has `ss === 2`.
- Verified in `tools/test_s03_u449_audit_fixes.js`: cast from the hand in my turn; activated from the Set position in my turn; activated from the Set position in the OPPONENT's turn; offered and resolved as a Spell Speed 2 chain
  response to the opponent's Spell (link 2, resolves first); face-up monsters of both fields turn face-down Defense; at the End Phase the opponent's face-down Defense monsters (also the ones not set by this card, ruling 08/04/19)
  turn face-up Defense, their Flip effect activates (ruling 08/04/22: アイヴィ・ウォール gave a token) and they draw that many; Replay audits; a save in the middle of the turn (the End Phase part is a scheduled handler in
  the JSON state) resumed in a fresh engine gives the same final digest and a valid Replay.
- 2011 rulings used (wiki backups 2011-06-26): no chain block at the End Phase (08/04/19), the End Phase part also runs when the resolution had nothing to turn (11/03/03), two Books in one chain count their own flips (09/09/01).
- Unresolved / not done: the End Phase ordering rulings (opponent's End Phase effects first, 08/04/19; the Lyra interleavings 09/09/01, 10/06/13) are not modelled (the scheduler runs the handler at the End Phase start);
  the legacy `priority:1` meta of this and ~20 older Quick-Play scripts was left as is (harmless in the DUEL engine).

## ④ サイバネティック・ヒドゥン・テクノロジー - the audit was correct

- Cause: S03-U445 wrote it as a Normal Trap (cost and destruction at the first activation, only from the Set position). It is a Continuous Trap (永続罠, db.sub '永続').
- 2011 basis (yugioh-wiki 《サイバネティック・ヒドゥン・テクノロジー》 + 2011-06-12 backup): the effect needs a cost EACH time (「効果の発動の度にコストを要求する」), can be activated several times (「複数回の効果の発動ができる」),
  FAQ 08/03/19: sending the monster is a cost; the effect targets the attacker; the cost monsters are 「サイバー・ドラゴン」 (or cards treated as it) and the Fusion Monsters that name it as a material
  (サイバー・ツイン / サイバー・エンド / キメラテック・フォートレス / キメラテック・オーバー・ドラゴン; NOT サイバー・レーザー / サイバー・バリア, NOT the 「サイバー・ドラゴンモンスター」 ones). No per-turn limit.
- Fix: `cards/HZZZZZZZZZZZC_claude_s03_u445_more_st.js` rewritten as a unified card with (1) the card activation (`ACTIVATE`, Spell Speed 2, `u422Fresh`; only places it face-up) and (2) a `TRIGGER` effect in the Spell & Trap Zone
  on the opponent's attack declaration (cost: the Cyber Dragon to the Graveyard; target: the attacker; destroy). The cost list uses `currentNameV17` for 'treated as' cards.
  Existing test changed: `tools/test_s03_u445_more_st.js` (the first-activation expectation and the 'no Cyber Dragon' negative now use the Continuous Trap semantics, with comments).
- New tests: first activation from the Set position = card activation only (face-up, no cost, attacker lives); next attack: the effect (cost + destruction); a third use with another Cyber Dragon (no limit);
  サイバー・ツイン・ドラゴン as cost; サイバー・レーザー・ドラゴン refused; no Cyber Dragon → not offered; Replay audit. Result: PASS.
- Unresolved: the optional trigger is offered in the attack-declaration event batch (before the response point window) like the other attack-declaration triggers of the engine; a chain response by the
  opponent to that activation is possible through the normal chain window. Cards that are only *treated as* 「サイバー・ドラゴン」 depend on their own name-override scripts being present.

## Tests

- `tools/test_s03_u449_audit_fixes.js` 49 / 0 (new, in `tools/check.py` and `tools/script_coverage.py`); changed: `test_s03_u349_event_traps.js`, `test_s03_u354_chain.js`, `test_s03_u445_more_st.js`, and
  `tools/test_p4_setcode_recovery.js` / the gap-record tests of U448 already committed.
- Declared status changes unchanged (the four cards stay TESTED); the evidence text of their `data/s03_status_changes.json` entries carries a CORRECTION / VERIFIED note.
