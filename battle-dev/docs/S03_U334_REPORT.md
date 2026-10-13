# S03-U334 — 「E・HERO」融合モンスター ×9

Base: `claude/work` `7edddf0` (U333, gate 19119 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change. Every card is Fusion Summoned through 「融合」 (S03-U130) in its test before the effect is checked.

## Cards (`cards/HZZZZZZV_claude_s03_u334_ehero_fusion.js`)
- サンダー・ジャイアント: ignition (Main Phase, once per turn): cost discard; target a face-up monster whose printed ATK is below its current ATK → destroy. ワイルド・ウィングマン: cost discard → destroy a chosen Spell/Trap (no once-per-turn).
- ジ・アース: release another face-up 「E・HERO」 (cost; its ATK stored in a card flag read before it leaves) → ATK + that value until the end of the turn.
- セイラーマン: `canDirectAttack` while a face-down card is in my Spell & Trap Zone. フレイム・ブラスト: continuous +1000 ATK in the Damage Step against a WATER battler.
- ダーク・ブライトマン: piercing; forced `onDamageStep` ('end') → Defense Position after attacking; forced Graveyard trigger (destroyed on the field) → destroy a chosen opponent monster.
- ネクロイド・シャーマン: forced `onSpecialSummon` trigger: destroy a chosen opponent monster, then — only if it was really destroyed (`API.afterDestroyS03` handler `u334.necroid-revive`, the destruction log) — an opponent Graveyard monster is chosen and Special Summoned onto the opponent's field.
- プラズマヴァイスマン: cost discard → destroy a chosen Attack Position opponent monster; piercing. マッドボールマン: a registration with no effects.
- Left: ランパートガンナー (a Defense Position monster attacking), ネオス・ナイト / ゴッド・ネオス / エリクシーラー, the ダーク・フュージョン-only monsters.

## Tests
- `tools/test_s03_u334_ehero_fusion.js` 30 / 0 (the nine Fusion Summons, each effect and its negatives, piercing figures, Defense Position after attack, the revive onto the opponent's field; Replay audits). Negative control on the previous build: 10 FAIL. Coverage TESTED 3052 → 3061, NOT_STARTED 797 → 788; audit 0 off-target.
- Authoring note: the coverage scan finds a card only by its literal name in the test file — a name built as `E('…')` was not seen (status stayed IMPLEMENTED); use the full literal name at least once.
