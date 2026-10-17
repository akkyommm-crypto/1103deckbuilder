# S03-U381 — three monsters with battle / targeting clauses

Base: `claude/work` `ce78c15` (U380, gate 20416 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZQ_claude_s03_u381_fusions.js`)
- 聖獣セルケト: `selfDestroyWhenS03` (no face-up 「王家の神殿」 in the Spell & Trap or Field Zone), `battleVictimBanishS03` (the victim of its battle destruction is banished instead of going to the Graveyard), a forced `onDamageStep` trigger after the battle (`a6DestroyedFoeInBattle`, as 聖導騎士イシュザーク) that adds a +500 ATK stat modifier (until it leaves / is turned face-down), once per victim (`turn:victimUid` card flag).
- 地天の騎士ガイアドレイク (Fusion): `continuous.immuneToTarget` (scope self) fed by `u378Source()` (S03-U378): the effect of an Effect Monster cannot target it; `protectV21 {effect:true, sourceKind:['m']}` (engine/1K) declares that Effect Monster effects cannot destroy it.
- ナイトメアを駆る死霊 (Fusion): `battleProof` from the text, `continuous.grantsDirectAttack` (direct attack although the opponent controls a monster), a forced `onDirectBattleDamage` trigger for the random discard (`duelRandomInt`, as エレキリム S03-U336) and `declareTargetedSelfDestroyS03` (engine/1ZM, S03-U137) for 「対象になった時、このカードを破壊する」 (a first trigger-based attempt did not fire after 月の書 had turned the monster face-down).
- The Fusion Summon of the two Fusion Monsters is the engine's Fusion procedure and is not tested here (they are placed on the field in the test).

## Tests
- `tools/test_s03_u381_fusions.js` 14 / 0. Negative control on the previous build: 4 FAIL (the file then stops at the missing script of ガイアドレイク). Coverage TESTED 3279 → 3282, NOT_STARTED 585 → 582; `registration_names_missing_from_db` empty; audit 0 FAIL.
