# S03-U361 — three Alien cards and 昇霊術師 ジョウゲン

Base: `claude/work` `df3daf8` (U360, gate 19991 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZW_claude_s03_u361_alien2.js`)
- エーリアン・マザー: the A Counter penalty is S03-U316's `alienContinuousS03(true)`. A victim's A Counters are gone once it has left the field, so the battle is marked when it is declared: a forced `onAttackDeclare` trigger stores the A Counter opponent's uid in a card flag (`u361Marked`); a forced Damage Step `leave` trigger checks that the destroyed battler is that card and registers a `battlePhaseEnd` schedule that Special Summons it from the Graveyard to my field and `API.linkOnLeave(monster, Mother, 'destroy')`.
- 異界空間－Aゾーン: a Field Spell (activation range `LOCATION.FIELD`, continuous `from:['field']`): the opposing monster that fights my face-up 「エーリアン」 gets ATK / DEF -300 while the Damage Step is open (`a5InDamageStep`, `a5BattleOtherOf`, `GROUP.ALIEN`).
- エーリアン・ブレイン: passive `onSendToGrave`; the Reptile and the attacker come from the event uid and `gameState.lastBattle` (`attackerUidV6` / `defenderUidV6`); `API.changeControl` + `API.setRace(…, '爬虫類', 'permanent')`.
- 昇霊術師 ジョウゲン: ignition with a random hand discard (`duelRandomInt`), destroys every monster with `card.specialSummoned === true` (the engine's own record); the lock is the script hook `specialSummonLockS03` (as A・O・J D.D.チェッカー).
- Not part of this unit: エーリアン・スカル (a procedure onto the opponent's field), エーリアン・ヒュプノ, エーリアン・リベンジャー (the one-only rule), 洗脳光線 / 集団催眠 (control for as long as counters remain / up to 3 targets).

## Tests
- `tools/test_s03_u361_alien2.js` 17 / 0. Negative control on the previous build: 8 FAIL. Coverage TESTED 3199 → 3203, NOT_STARTED 651 → 647; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lessons: a Field Spell is activated into `LOCATION.FIELD` (continuous `from:['field']`, zone 'field'); counters on a monster are cleared when it leaves, so a battle outcome that depends on them must be marked at the attack declaration.
