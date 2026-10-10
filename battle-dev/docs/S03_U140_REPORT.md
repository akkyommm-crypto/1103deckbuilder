# S03-U140 — シューティング・クェーサー・ドラゴン

## Why
シューティング・クェーサー・ドラゴン (fixed Debris list x1) was PARTIAL. Its AUTO_DECK_TABLE entry was a plain "recruit
シューティング・スター・ドラゴン" ignition, which does none of its text: no multiple attacks, no negation, and no summon when it
leaves the field.

## Change
- New `cards/HX_claude_s03_u140_quasar.js` (added to `build_manifest.json`), a v4 card:
  - ①: `attackLimit(card)` is the number of non-Tuner materials in the Synchro material snapshot (`v380SummonMaterials`,
    recorded at its Synchro Summon), with a minimum of 1.
  - ② `negate`: a Quick Effect answering the activation of any Spell / Trap / monster effect. It is declared in
    `ACTIVATION_RESPONSE_S03`, so it answers the top chain link, then `API.negateChainLink(…, 'activation', …, true)`. The
    limit is once per turn with `countLimit:{n:1, effects:['negate']}` in the card options.
  - ③ `star`: an optional `onLeaveField` trigger when the card leaves the monster zone face-up, wherever it went (GY,
    banished, Extra Deck …). It Special Summons シューティング・スター・ドラゴン from the Extra Deck.
  - シューティング・スター・ドラゴン has no summon condition, and U127's rule only covers the GY / banished zone.
- Correction to a note made during U139/U140 work: the chain-response path does apply per-effect limits when they are
  declared in the card options (the 無零 convention). Putting `countLimit` on the effect object is simply ignored. There
  is no engine gap.

## Test — `tools/test_s03_u140_shooting_quasar.js` 12/0 (real DUEL path, Replay-audited)
- A: フォーミュラ・シンクロン + TG ハイパー・ライブラリアン + 魔轟神レイジオン → Synchro Summoned, attack limit 2.
- B:
  - Offered as a response to the opponent's サンダー・ボルト; it negates and destroys it, and Quasar survives.
  - It is not offered against a second サンダー・ボルト the same turn, which then destroys it.
- C:
  - Destroyed by the opponent's サンダー・ボルト → シューティング・スター・ドラゴン is summoned from the Extra Deck.
  - Face-down when it left → nothing happens.
- Negative control on U139: 4 FAIL.
- Pre-scan of all 359 gate tests (parallel): 0 FAIL.

## Status
- シューティング・クェーサー・ドラゴン PARTIAL → TESTED (focus registered). TESTED 2216 → 2217, PARTIAL 169 → 168.
