# S03-U386 — the ブレイズ・キャノン cluster

Base: `claude/work` `c6e9311` (U385, gate 20521 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZV_claude_s03_u386_blaze.js`)
- ブレイズ・キャノン (Continuous Spell; the card activation only places it): ignition in my Main Phase; the target (an opposing monster) is chosen at activation, on resolution a Pyro monster with ATK 500 or less is chosen and sent from the hand to the Graveyard (`API.sendHandToGrave`) and the target is destroyed. The sent card gets a turn-stamped card flag `u386Cannon` (a hand-to-Graveyard send records no effect source). 「このターン自分のモンスターは攻撃できない」 = the player flag `noAttackDeclareS03` (S03-U170).
- クレイジー・ファイヤー (Quick-Play Spell): cost 500 LP; destroys my ブレイズ・キャノン-named card(s), then every monster on the field, then `API.createToken` of one クレイジー・ファイヤー・トークン (炎族・炎・星3・1000/1000) in Attack Position; the same attack flag.
- ヴォルカニック・バックショット: ONE forced Graveyard trigger (a card's forced triggers of one event are offered once per window): 500 damage; when it carries the `u386Cannon` stamp and two more copies exist in hand + Deck, a yes / no (`API.confirm`) sends two of them to the Graveyard (each burns 500 by its own trigger) and destroys all the opponent's monsters.

## Tests
- `tools/test_s03_u386_blaze.js` 17 / 0. Negative control on the previous build: 15 FAIL. Coverage TESTED 3301 → 3304, NOT_STARTED 563 → 560; `registration_names_missing_from_db` empty; audit 0 FAIL.
