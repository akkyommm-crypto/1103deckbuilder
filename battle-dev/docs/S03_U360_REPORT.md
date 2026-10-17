# S03-U360 — four monsters: battle-time ATK, a forced target, a banish-for-search, a three-mode banisher

Base: `claude/work` `81bec24` (U359, gate 19974 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZV_claude_s03_u360_misc.js`)
- サイバー・オーガ・2: continuous ATK read from `gameState.battle` while it attacks a monster (+ half the target's current ATK).
- E・HERO ブルーメ: `cannotNormalSummon`; 「ブルーメンブラット」 only comes from the card text (`summonOnlyByS03`); `cannotBeAttackTarget` for the controller's other monsters; a forced `onBattleDamage` trigger (`a3DealtBattleDamage`) counts in a card flag read by the continuous ATK +200n / DEF -200n.
- E・HERO フラッシュ: Graveyard trigger after a battle destruction; the cost banishes itself and three differently named E・HERO monsters; resolution returns a Normal Spell (no sub-type) from the Graveyard to the hand.
- サイバー・ヴァリー: three separate effects (an `onAttackDeclare` trigger that banishes itself, draws 1 and calls `API.endBattlePhase`; two main-phase ignitions with banish costs that draw 2 / return a Graveyard card to the top of the Deck).
- Not part of this unit: E・HERO ランパートガンナー / 絶対防御将軍 (a Defense Position monster attacking is not supported by the attack flow), E・HERO ネオス・ナイト (needs the record of the Fusion Materials), E・HERO バブルマン・ネオ (name treated as another card), サイバー・ブレイダー (its 3-monster mode negates the opponent's activated effects).

## Tests
- `tools/test_s03_u360_misc.js` 17 / 0. Negative control on the previous build: 9 FAIL. Coverage TESTED 3195 → 3199, NOT_STARTED 655 → 651; `registration_names_missing_from_db` empty; audit 0 FAIL.
