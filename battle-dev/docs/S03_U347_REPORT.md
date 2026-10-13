# S03-U347 — eight monsters

Base: `claude/work` `643eaa6` (U346, gate 19650 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZI_claude_s03_u347_misc.js`)
- フレムベル・デスガンナー / インヴェルズ・グレズ: `cannotSpecialSummon` + a single restricted `normalSummonProcedure` method (one 「フレムベル」 Tribute / three 「インヴェルズ」); ignition effects: banish a DEF-200 monster from the Graveyard (its ATK parked in a card flag) → damage; half LP paid as the cost → destroy every other card of the field.
- ネオフレムベル・シャーマン: forced `onDamageStep` ('leave') battle-kill trigger (`gearKilledFoeS03`) gated by ≥3 「フレムベル」 in my Graveyard; the opponent's Graveyard card is chosen and banished, +500 damage when no Spell Card was in that Graveyard at that time.
- 速攻の黒い忍者: QUICK effect (once per turn): the cost banishes two DARK monsters; the ninja banishes itself and an End Phase schedule returns it (a `MOVE`, face-up, same position; the Graveyard when no zone is free).
- マジオシャレオン: continuous `cannotBeAttackTarget` (the attacker's field holds a Spell/Trap Card) + `piercingDamage`. ボタニカル・ライオ: continuous +300 per own face-up Plant, `controlLockS03` while face-up on the field. 幻影の妖精: forced `onAttackDeclare` trigger → choose another own monster → `redirectAttack`.
- サモン・リアクター・AI: forced triggers on the opponent's Normal / Special Summon (800 damage once per turn, a card flag `u347AiTurn` that also enables the Battle Phase negation of that turn) + a speed-2 `onAttackDeclare` trigger (`API.negateAttack`, once) + an ignition effect sending AI / トラップ・リアクター・RR / マジック・リアクター・AID to the Graveyard and Special Summoning ジャイアント・ボマー・エアレイド from the hand / Deck / Graveyard (its own 「AIの効果でのみ」 restriction is read from its text and accepts this reason).
- Not part of this unit: ジャイアント・ボマー・エアレイド (its second effect needs a Set-card event the engine does not dispatch), ジュラック・スタウリコ / タイタン (a token not releasable for non-Jurrac Advance Summons; effect-only target immunity), ライトロード・ドルイド オルクス, 渋い忍者 (once-only-on-the-field rule), コアキメイル・ウォーアームズ / グールズスレイブ, インヴェルズの斥候 / 魔細胞.

## Tests
- `tools/test_s03_u347_misc.js` 45 / 0. Negative control on the previous build: 27 FAIL. Coverage TESTED 3137 → 3145, NOT_STARTED 713 → 705; `registration_names_missing_from_db` empty; audit 0 off-target. Pre-scan: no other test names these cards.
- Authoring note: `getLegalZoneActions(0, …)` lists a Quick Effect of mine only in my own turn, but `duelActivateFromZone` works in the opponent's turn.
