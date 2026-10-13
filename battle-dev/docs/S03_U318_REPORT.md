# S03-U318 — 「ガスタ」: ダイガスタ ×4 + ガスタの神官 ムスト

Base: `claude/work` `2d1344f` (U317, gate 18694 PASS / 0 FAIL). Sonnet 5.5, single writer. All five NOT_STARTED; no engine change (existing `battleDamageRedirect`, `protectV21`, `negatedUntilTurn`, Synchro Summon trigger helper `s03SelfSynchroSummonedU121`).

## Change (`cards/HZZZZZZF_claude_s03_u318_gusto.js`)
- ダイガスタ・ファルコス: Synchro Summon success → every face-up 「ガスタ」 of both players +600 ATK (permanent modifier at that time).
- ダイガスタ・スフィアード: Synchro success → optionally add a 「ガスタ」 card from my GY to hand; while face-up, battle damage to me from a battle involving my face-up 「ガスタ」 is dealt to the opponent instead; not destroyed by battle.
- ダイガスタ・ガルドス: once per turn, cost = return two 「ガスタ」 monsters of my GY to the Deck; destroy one face-up opponent monster (targeted).
- ダイガスタ・イグルス: my End Phase, cost = banish a WIND monster from my GY; destroy one Set card of the opponent.
- ガスタの神官 ムスト: once per turn in my Main Phase, return a 「ガスタ」 monster from my GY to the Deck and negate a face-up monster until the End Phase.

## Tests
- `tools/test_s03_u318_gusto.js` 33 / 0 (real Synchro Summons with `doExSummon`, real attacks and phase steps; each effect with its negatives and Replay audits). Negative control on the previous build (`HEAD` dist): 11 FAIL. Coverage TESTED 2981 → 2986, NOT_STARTED 866 → 861; audit 0 off-target.
- Authoring note: a test-local helper must not be named `act` (it overwrites the engine's global `act`, so nothing is recorded; the symptom is Replay `count: 0`).
