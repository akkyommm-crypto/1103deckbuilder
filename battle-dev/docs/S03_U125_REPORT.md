# S03-U125 — 暗黒界の武神 ゴルド / 暗黒界の龍神 グラファ: targets on activation + グラファ's missing hand clause

## Why
Deferred finding since U112 (dark deck). Measured on U124:
- ゴルド: "相手フィールド上に存在するカードを2枚まで**選択して**破壊する事ができる" — the cards were chosen at resolution,
  one by one; by rule they are targets chosen when the effect is activated (the opponent must be able to respond to them).
- グラファ: "相手フィールド上に存在するカード1枚を**選択して**破壊する" — same (chosen at resolution).
- グラファ: "相手のカードの効果によって捨てられた場合、さらに相手の手札をランダムに1枚確認する。確認したカードがモンスター
  だった場合、そのモンスターを自分フィールド上に特殊召喚する事ができる。" — **not implemented at all**.

## Change
- `cards/10_themes_a.js` ゴルド: `selectTargets` — only when discarded by the opponent's effect — asks 0 to 2 opponent
  cards (`targeting:true`, multi-select); `resolve` Special Summons it, then destroys the targets still on the opponent's
  field. The old `s03u62.gold-destroy-*` handlers stay for old saves.
- `cards/20_control_counter.js` グラファ: `selectTargets` for the discard trigger (1 opponent card, targeting); `resolve`
  destroys it; if discarded by the opponent's effect, `graphaPeekHandS03`: the journaled action `GRAPHA_PEEK_S03` picks the
  random card **inside the reducer** (`duelRandomInt(n, gs)`, so Replay reproduces it — a script-side random would
  desynchronise the RNG), logs it and, if it is a monster, asks 「特殊召喚しますか？」 (registered handler
  `s03u125.grapha-steal`) → Special Summon from the opponent's hand to グラファ's controller's field.
- `engine/00_state_actions.js`: `GRAPHA_PEEK_S03` reducer case.

## Test — `tools/test_s03_u125_dark_world_targets.js` 15/0 (real DUEL path, Replay-audited)
- A ゴルド (opponent's 手札抹殺): the 0–2 target choice comes before the chain link; 2 chosen → on the chain with 2 targets
  → both destroyed, the third stays; 0 chosen → Special Summoned, nothing destroyed.
- B グラファ (own 暗黒界の門): target on activation, destroyed; no hand peek.
- C グラファ (opponent's 手札抹殺): target destroyed; GRAPHA_PEEK_S03 journaled; the checked monster → yes → on グラファ's
  controller's field; Replay audit reproduces the random pick.
- D the only opponent hand card is a Spell → checked, no question.
- Negative control on U124: A, B, C fail (resolution-time choice; no peek).
- `tools/test_s03_u112_gateway_dark_world.js` D2: its generic picker only toggled the (now multi-select) ゴルド target
  choice — it now confirms it (`__choiceCommitV49`, as the UI's 確定 does); assertions unchanged; 32/0.
- Tests naming 暗黒界 / 手札抹殺 / discard re-run: 0 FAIL.

## Status
- No status change (both already TESTED; focus registration added).

## Gate (combined U124 + U125, tree s03_u125)
- `python tools/check.py` — `GATE_EXIT=0`, 13907 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `09ffbc089d07f63b5c10ab16ec800ec0afc5d049ac5dd7fb5561c39932e3585d`; Acode regenerated after the gate: `dist/battle_acode.html` `ec4afebbfe5e1fb6686825da45c17f8610f6b6a3aed0a92ee9a5d476b20b09aa`.
- Coverage: TESTED 2191, IMPLEMENTED 108, ENGINE_GAP 609, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1272 (4996);
  146 declared status changes, 0 off-target.
