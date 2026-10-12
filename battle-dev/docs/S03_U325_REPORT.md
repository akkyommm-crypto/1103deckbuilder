# S03-U325 — 「ラヴァル」: ロード・ジャッジメント, グレイター, ステライド, ツインスレイヤー, 炎湖畔の淑女, ラヴァルバル・ドラゴン (+ engine: substitute kind banishGrave)

Base: `claude/work` `a2321a4` (U324, gate 18908 PASS / 0 FAIL). Sonnet 5.5, single writer. All six NOT_STARTED (ラヴァルバル・イグニス, an Xyz Monster, left).

## Engine change (`engine/1ZV_destroy_substitute_s03.js`)
- New optional substitute kind `banishGrave` (`destroySubstituteS03:{kind:'banishGrave', causes:['effect'], filter(card)}`): the controller may banish a matching monster of its own Graveyard instead of the destruction; asked at the destruction with the other substitutes (option label 「代わりに墓地の「…」を除外する」, a card chosen as one substitute cannot be chosen again, the protected card is spared). Existing substitute tests (u173, u294, u317) unchanged.

## Cards (`cards/HZZZZZZM_claude_s03_u325_laval.js`)
- ジャッジメント: once per turn banish a Laval from the GY → 1000 damage; `cannotAttackTurn` set in the cost.
- グレイター / ステライド: forced hand discard (chosen) on Synchro Summon; グレイター: `banishGrave` substitute (effect destruction); ステライド: declared activation response when the link targets it (cost: banish a Laval; negate + destroy).
- ツインスレイヤー: with ≥2 Laval in the GY an extra attack after attacking a Defense Position monster (once per turn); with ≥3 piercing damage.
- 炎湖畔の淑女: Graveyard ignition (≥3 different Laval names, banish itself + one other) → destroy a Set card of the opponent. ラヴァルバル・ドラゴン: return two Laval from the GY to the Deck → return an opponent card to its owner's hand.

## Tests
- `tools/test_s03_u325_laval.js` 30 / 0 (real Synchro Summons, battle, the chain window, the substitute prompt (use / decline / battle); Replay audits). Negative control on the previous build: 16 FAIL. Coverage TESTED 3012 → 3018, NOT_STARTED 835 → 829; audit 0 off-target.
- Authoring note: put every fixture card (e.g. a Spell used later) in the hand before `baselineA()`; a later `hand.push` breaks the Replay audit.
