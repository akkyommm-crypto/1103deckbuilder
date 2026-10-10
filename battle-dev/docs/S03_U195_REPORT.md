# S03-U195 — おジャマトリオ (token destruction damage) + TG

## Engine: 「このトークンが破壊された時にそのコントローラーは…ダメージを受ける」
Destroyed tokens vanish inside the FX_TO_GRAVE / FX_WIPE_ZONE / BATTLE_CLEANUP reducers. The damage is carried through as follows:
1. TOKEN_CREATE / `API.createToken` carry `destroyDamageS03`.
2. `recordTokenGoneV11` (engine/1A) keeps the amount.
3. `v9DetectLeaveField` (engine/18) queues it in a live-only list tagged with its state object, like `LAST_DEPARTED_V9`.
4. `enforceLinkedLeaveV9` applies it at the rule processing point as a journaled LP Action (`applyTokenDestroyDamageS03`).

Entries created while a Replay audit re-runs the reducers on its own state are dropped. The test found this: a leftover entry had damaged
the next scenario.

## Cards (IMPLEMENTED → TESTED)
- おジャマトリオ: it now needs 3 free zones (before: fewer tokens when the opponent had less room). The tokens can't be Tributed for a
  Tribute Summon (`noAdvanceTributeS03`) and deal 300 damage to their controller when destroyed.
- TG ジェット・ファルコン: it had no trigger event. It is now a forced trigger when it is sent to the GY as Synchro Material.
- TG カタパルト・ドラゴン: `timing:['mainPhase']` (before: any phase). The summon now uses the chosen card's uid.
- TGX300: script unchanged, now tested.

## Tests
`tools/test_s03_u195_ojama_tg.js` 17/0 (real DUEL paths, Replay-audited).
- おジャマトリオ: token destruction by ブラック・ホール (900) and by battle (300, no battle damage).
- TG ジェット・ファルコン: a Synchro Summon of 大地の騎士ガイアナイト triggers it; a discard as a cost doesn't.

Negative control on U194: 7 FAIL. Token and v9-link tests: 0 FAIL.

## Left
The splendid VENUS stays IMPLEMENTED. Its 「自分フィールドの魔法・罠カードの効果の発動及びその発動した効果は無効化されない」 needs a
negation-immunity mechanism that the engine lacks. It is recorded on the pending list.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15112 PASS / 0 FAIL** (= U194 15095 + 17 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U194.
- Coverage: TESTED 2412, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 12, GENERIC_OK 644, PARTIAL 121 (4996); audit 373 declared, 0 off-target.
