# S03-U351 — five small monsters

Base: `claude/work` `f8ed348` (U350, gate 19779 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZM_claude_s03_u351_smallmon.js`)
- X－セイバー ガラハド: continuous ATK hook read from `gameState.battle` (+300 when it attacks a monster, -500 when it is attacked; the ジェイン / ラッシュ・ライノ pattern); a speed-2 trigger on `onAttackDeclare` with a release cost of another 「セイバー」 and `API.negateAttack` (ゼンマイナイト pattern).
- オアシスの使者: continuous `cannotBeAttackTarget` on itself while a face-up Level 3 or lower Normal monster is on its controller's field, and a `battleDamage` hook (0 when the battle involves such a monster and the damage goes to its controller).
- イービル・ソーン: the release is the cost; 300 damage and up to 2 copies from the Deck in Attack Position, each with `API.negateEffectUntil(..., 'permanent')`.
- C・リペアラー: forced Damage Step `leave` trigger (gearKilledFoeS03) for the 300 damage; the once-per-turn Graveyard revive of a C monster of Level 4 or lower marks the card `cannotAttackTurn`. `countLimit` is a meta key.
- C・コイル: once-per-turn ignition, `v4RegisterStatModifier({atk:300, def:300})` until the End Phase on a C monster (itself included).
- Not part of this unit: インセクト女王 (the attack-declaration release cost), キラー・ラブカ (ATK drop until my NEXT End Phase), グラヴィティ・ベヒモス (the attack replacement that destroys a Field Spell), G・B・ハンター (a "cannot return to Deck" lock), インヴェルズの魔細胞 (release restriction).

## Tests
- `tools/test_s03_u351_smallmon.js` 29 / 0. Negative control on the previous build: 15 FAIL. Coverage TESTED 3160 → 3165, NOT_STARTED 690 → 685; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lesson: never name a test helper `act` — it replaces the engine's global `act()` and every duel action silently does nothing (the test helper is `actC`).
