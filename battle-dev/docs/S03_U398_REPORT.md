# S03-U398 - Holy Lamp (聖なるあかり), Summoner Monk (召喚僧サモンプリースト), Decoy Dragon (デコイドラゴン)

Base: `claude/work` `4db6e12` (U397, gate 20758 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZZH_claude_s03_u398_light.js`)
- 聖なるあかり: protectV21 battle protection against DARK partners (ctx.opponentCard), continuous.battleDamage 0, continuous cannotAttack for DARK monsters, summonLockS03 for DARK Normal / Special Summons of both players.
- 召喚僧サモンプリースト: forced Summon / Flip Summon triggers (Defense Position), noAdvanceTributeS03 (no Tribute), once-per-turn ignition with a Spell discard cost special summoning a Level 4 monster from the Deck (cannotAttackTurn).
- デコイドラゴン: optional trigger when attacked: Special Summon a Level 7+ Dragon from the Graveyard and API.redirectAttack to it.

## Tests
- `tools/test_s03_u398_light.js` 20 / 0. Negative control on the previous build (card file removed): 11 FAIL. No existing test changed. Coverage TESTED 3339 -> 3342, NOT_STARTED 531 -> 528; `registration_names_missing_from_db` empty; audit 0 FAIL.
