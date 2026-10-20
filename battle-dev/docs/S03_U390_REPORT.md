# S03-U390 — four PARTIAL entries and a hand-activation fix

Base: `claude/work` `6cc1c7c` (U389, gate 20588 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZZ_claude_s03_u390_partials.js`)
- 白竜の聖騎士: forced `onDamageStep` trigger (`a3IsAttacker` / `a3AttackTarget` / `a3DestroyBeforeDamage`, dsTiming 'start') for the face-down Defense attack; ignition release effect (cost = the Knight sent to the Graveyard) Special Summons a 青眼の白龍 of the hand / Deck and stamps it `cannotAttackTurn`. The Ritual Summon is 白竜降臨 (already scripted).
- 魔法の歯車: cost = three face-up `GROUP.ANCIENT_GEAR` cards sent to the Graveyard (`u342PickN`); one 古代の機械巨人 from the hand and one from the Deck with `opts.ignoreSummonConditionS03`; my other monsters destroyed; `banSummonS03` ['normal'] for turns t..t+2 (the activation turn and my next turn).
- 人海戦術 (Continuous Trap): forced End Phase trigger counts my Level 2 or lower Normal Monsters destroyed by battle this turn (`graveInfo.battle` / `lv`) and Special Summons as many from the Deck, then shuffles.
- ボスラッシュ (Continuous Spell): activation needs `normalSummonUsed` false; `summonLockS03` for my Normal Summons; End Phase trigger (yes / no) for a 巨大戦艦 of the Deck after one of mine was destroyed this turn (`graveInfo`).

## Fix found on the way (hand activation of Continuous Spells)
- A Continuous Spell activated from the hand is judged in the logical zone `'sz'` with the hand card's face `'up'`; the common ACTIVATE guard `!(ctx.zone==='sz' && ctx.card.face==='up')` therefore refused the activation. The guard now asks `locateCardAnyV4(ctx.card)` whether the card REALLY stands in the Spell & Trap Zone: ゼンマイマニュファクチャ (S03-U385), 昇華する魂 (S03-U370; additionally `fieldIgnition:true`, because its summon-event passive made the engine treat it as activatable only when a monster is Summoned) and the new ボスラッシュ. Hand-activation checks were added to both tests. A scan of all 73 unified Continuous / Field Spells (empty board, card in hand) found no other card affected that is mine (three older cards, 超栄養太陽 / 魂の共有－コモンソウル / 鉄壁の布陣, show no activation and probably have real conditions).

## Tests
- `tools/test_s03_u390_partials.js` 25 / 0. Negative control on the previous build: 9 FAIL. Tests changed: `test_s03_u385_misc7.js` (+2 checks) and `test_s03_u370_ritual_react.js` (+1 check). Coverage TESTED 3314 → 3318, PARTIAL 16 → 12; `registration_names_missing_from_db` empty; audit 0 FAIL.
