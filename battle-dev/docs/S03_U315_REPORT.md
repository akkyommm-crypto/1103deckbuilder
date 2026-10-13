# S03-U315 — Equip Spells: 伝説の黒帯, 剣の煌き, ロケット・パイルダー

Base: `claude/work` `d40076a` (U314, gate 18625 PASS / 0 FAIL). Sonnet 5.5, single writer. On the S03-U312 helper (`u312Define`); all three were NOT_STARTED.

## Change
- P4 authority P4-v9 → P4-v10: `GROUP.XSABER` (「X－セイバー」, 18 cards — XX－セイバー included, as their names contain it). Counts: predicate 41, authority 565, overlay 419, membership 587 (`test_p4_setcode_authority.js` pins updated).
- `cards/HZZZZZZC_claude_s03_u315_equips3.js`:
  - 伝説の黒帯: own 「格闘ねずみ チュー助」「モンク・ファイター」「マスターモンク」; forced trigger when the host destroys a monster by battle and it goes to the Graveyard: damage = the printed DEF of that monster.
  - 剣の煌き: GROUP.XSABER host; optional (not targeted) destruction of 1 opponent card after a battle kill; Graveyard ignition: release a monster → this card to the top of the Deck.
  - ロケット・パイルダー: the host is not destroyed by battle while it is the attacker (protectV21 + `battleRole`); at the end of the Damage Step the attacked monster loses ATK equal to the host's ATK until the turn ends.
- `u312EquipEffect` fix (S03-U312 helper): the host predicate now also gets `db` in `operation` (`resolveTarget` handles carry none); the earlier cards were unaffected (their predicates read `x.card`).
- Two scripts needed `timing:['free']`: a script's timing is inferred from its passive hooks (an `onDamageStep` passive ⇒ Damage Step only), which refused the Main Phase equip activation (same finding as S03-U313).
- Observation (not changed): a card in the Spell & Trap Zone receives only the Damage Step's `leave` step; scripts that mean 「ダメージステップ終了時」 for such a card read `leave`.

## Tests
- `tools/test_s03_u315_equips3.js` 20 / 0 (listed hosts only; 1200 damage on a battle kill; the optional destruction; the Graveyard effect with its cost and the card on top of the Deck; the attacker-only protection and the ATK reduction, which ends with the turn; the defender case; Replay audits). Negative control on the previous build: 12 FAIL. `test_p4_setcode_authority` 103 / 0, `test_s03_u312` 41 / 0, `test_s03_u233` 26 / 0.
- Coverage: TESTED 2970 → 2973, NOT_STARTED 877 → 874; audit 0 off-target.

## Not done (recorded)
- 竜殺しの剣 (carddata holds the modern ①② wording of a 2000 card; the 2011 text is not confirmed), 破邪の大剣－バオウ (needs the battle-destroyed negator for an Equip Spell), 憎悪の棘 (the attacked monster's battle protection), 草薙剣 / コアバスター (the equipped monster leaving → this card back to the hand: a marker like 闘器's), ファイティング・スピリッツ / 白銀の翼 (optional substitutes), バブル・ショット / 八汰鏡 (battle-only substitute + 0 damage / the Spirit return exception), コアキメイル cards (group missing).
