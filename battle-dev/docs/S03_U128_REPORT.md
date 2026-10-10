# S03-U128 — ドッペル・ウォリアー ①/② + 死者蘇生 revives straight from the opponent's GY

## Why
Scouting the single-copy IMPLEMENTED cards of the fixed lists (debris x1). Measured on U127:
- ① 「自分の墓地からモンスターが特殊召喚された時、このカードを手札から特殊召喚する」 did not exist.
- ② 「S素材として墓地へ送られた場合、ドッペル・トークン2体」 triggered on **any** send to the GY (destroyed by サンダー・ボルト →
  tokens), and as Synchro Material it produced **4** tokens (it triggered twice); with 1 free zone it created 1 token.
- Found with it: 死者蘇生 revived an opponent's monster by first moving it into its own GY (control change on the GY
  card) and then summoning it "from its own GY" — so "自分の墓地から特殊召喚された" effects reacted to the opponent's monster,
  and the index remembered on activation was used.

## Change
- `cards/10_themes_a.js`: ドッペル・ウォリアー as a v4 card with keyed effects: `hand-summon` (TRIGGER from the hand on another
  monster's Special Summon from the controller's own GY — `specialSummonedFrom==='grave'` and `specialSummonedFromPlayer`;
  `onOtherSummon:true`) and `tokens` (TRIGGER from the GY; only for the `synchroMaterial` reason; needs 2 free zones; 2 tokens
  at once).
- `cards/00_generic_core.js` 死者蘇生: resolves the target at resolution and Special Summons it straight from its GY
  (`API.specialSummon(..., fromPlayer)`), so the origin is recorded correctly and it returns to its owner's GY.

## Test — `tools/test_s03_u128_doppel_warrior.js` 10/0 (real DUEL path, Replay-audited)
- A: ワイト revived from own GY → ドッペル・ウォリアー Special Summoned from the hand (chain link); from the opponent's GY → no
  trigger, origin recorded as the opponent, destroyed → back to the opponent's GY.
- B: Synchro Material of TG ハイパー・ライブラリアン → exactly 2 tokens in Attack Position.
- C: destroyed by サンダー・ボルト → no tokens.
- Negative control on U127: A, B (4 tokens), C fail.
- Tests naming 死者蘇生 / ドッペル / specialSummon / changeControl re-run on the U128 build (64 files): 0 FAIL.

## Status
- ドッペル・ウォリアー IMPLEMENTED → TESTED. TESTED 2192 → 2193, IMPLEMENTED 108 → 107. 死者蘇生 stays TESTED (focus added).
