# S03-U394 - Linear Cannon (リニアキャノン), Absolute Inviolable Territory (絶対不可侵領域), Impulse to the Limit (極限への衝動)

Base: `claude/work` `add728f` (U393, gate 20685 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZZD_claude_s03_u394_cannon.js`)
- リニアキャノン: the sacrifice is the cost; half of the printed ATK as damage; the used card lingers and an activationLockS03 stops further Spell activations of mine in that turn.
- 絶対不可侵領域: own Standby Phase only; discard as cost; banSummonS03 (Normal / Special) for the opponent's next turn.
- 極限への衝動: two hand cards as cost; two ソウルトークン through API.createToken. Known limit: a Release for the cost of an effect is not intercepted (same as the U388 cloud Tokens).

## Tests
- `tools/test_s03_u394_cannon.js` 17 / 0. Negative control on the previous build (card file removed): 6 FAIL (the negative checks pass vacuously there). No existing test changed. Coverage TESTED 3327 -> 3330, NOT_STARTED 541 -> 538; `registration_names_missing_from_db` empty; audit 0 FAIL.
