# S03-U188 — staples without a dedicated test (3 script fixes)

## Finding
Ten staple cards had scripts (IMPLEMENTED) but no dedicated test. Writing real-path tests exposed three scripts that did not follow
the 2011 text:
- 魔法の筒: the condition read `gameState.battle`, which does not exist at the attack declaration (the attack is in
  `gameState.pendingAttack`), so the card was never offered; it also ended the battle with `endBattle()` instead of negating the attack.
- 終焉の焔: it created 「闇トークン」 1000/1000 Lv3, with no turn restriction and no tribute restriction.
- デモンズ・チェーン: only the opponent's monsters could be chosen (the text says any face-up effect monster), the negation was a
  permanent `API.negate`, the continuous compared object identity with `chainedTo` (never set), and 「選択したモンスターが破壊された時、
  このカードを破壊する」 was missing.

## Fixes
- 魔法の筒 (cards/20_control_counter.js): reads `pendingAttack`, targets the attacker, `API.negateAttack` (NEGATE_ATTACK_V45), then
  damage equal to the attacker's ATK at resolution; face-down passive for the attack-declaration window.
- 終焉の焔 (cards/00_generic_core.js): 2 「黒焔トークン」 (悪魔族・闇・Lv1・0/0) in Defense Position, 2 free zones needed; not activatable
  after a summon this turn; the turn's Normal / Flip / Special Summons locked at resolution, as for スケープ・ゴート
  (`declareActivationNegatedReleaseS03`). Engine: token flag `noAdvanceTributeNonDarkS03` (TOKEN_CREATE / `API.createToken`),
  read by `tributeCandidates(p, targetDb)` (engine/70; `tributeCandidatesForV23` passes the summoned monster's db).
- デモンズ・チェーン (cards/00_generic_core.js + the continuous in 20_control_counter.js): zone-local uid marks
  `stLinkTargetS03` (on the trap) / `stLinkByS03` (on the monster) drive the negation and the attack lock while the trap is face-up.
  v9 link mode `destroyIfDestroyed` (engine/18): the trap is destroyed only when the watched monster was destroyed
  (graveInfo.byDestroy of this turn); any other departure ends the link (LINK_CLEAR_V9).
  Known limit: a monster that is destroyed and banished (FX_DESTROY_BANISH) carries no destroy mark and is not detected.

## Cards (IMPLEMENTED → TESTED)
大嵐, D.D.クロウ, 魔法の筒, 炸裂装甲, 洗脳－ブレインコントロール, 成金ゴブリン, 突進, 終焉の焔, ライトニング・ボルテックス, デモンズ・チェーン.

## Tests
`tools/test_s03_u188_staples.js` 36/0 (real DUEL paths, Replay-audited). Negative control on U187: 11 FAIL (魔法の筒, 終焉の焔,
デモンズ・チェーン).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14945 PASS / 0 FAIL** (= U187 14909 + 36 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U187.
- Coverage: TESTED 2361, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 63, GENERIC_OK 644, PARTIAL 121 (4996); audit 322 declared, 0 off-target.
