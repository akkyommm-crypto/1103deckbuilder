# S03-U117 — temporary control-change restrictions are card-specific (精神操作) + permitted direct attacks no longer force a battle replay

## Why
Started from the qty=2 card 精神操作 ("…コントロールを得たモンスターは攻撃宣言できず、リリースできない"). Measured on U116:
1. `FX_CONTROL` with `until:'endPhase'` set `cannotAttack` + `cannotTribute` on **every** temporary control change —
   心変わり, 洗脳－ブレインコントロール, X・E・N・O, シンクロ・コントロール, エレクトリック・ワーム, パペット・プラント,
   デーモン・テイマー, ドラゴン・ライダー, A・O・J エネミー・キャッチャー, No.34 電算機獣テラ・バイト, 幻惑のラフレシア,
   シエンの間者. Only 精神操作's text has that restriction: a monster taken by 心変わり could neither attack nor be
   Tributed (the classic 心変わり → Tribute Summon line was impossible), and X・E・N・O's granted direct attack was dead.
2. Found while testing X・E・N・O: `attackReplayNeededV28` opened a battle replay for **every** direct attack while the
   opponent controlled monsters, ignoring direct-attack permission. In DUEL, no "can attack directly" monster
   (ラージマウス, レッグル, 人造人間7号, 女王の影武者, … about 30 scripts, plus granted permissions) could ever deal its direct
   attack past a monster — the attack always stopped at the replay prompt.
心変わり, X・E・N・O and ラージマウス were already TESTED — their tests called scripts directly or checked only the
permission predicate, not the real attack path.

## Change
- `engine/00_state_actions.js` `FX_CONTROL`: the restriction comes from `a.restrictS03 = {noAttack, noTribute}`.
  An action without `restrictS03` (journals saved before this unit, manual `zControl`) keeps the old meaning (both), so
  old Replays reproduce.
- `engine/40_legal_script_engine.js` `API.changeControl(t, toPlayer, reason, until, sourceTarget, restrict)`: always
  writes `restrictS03` for `until:'endPhase'` (default: no restriction).
- `cards/20_control_counter.js` 精神操作: passes `{noAttack:true, noTribute:true}`.
- `engine/30_processor_chain_battle.js` `attackReplayNeededV28`: a direct attack with an unchanged defender set is not
  replayed when the attacker may attack directly through monsters (`canDirectAttackThroughMonstersV51`). A changed
  defender set still replays; a monster without the permission is still refused at declaration.

## Test — `tools/test_s03_u117_control_restrictions.js` 28/0 (real DUEL path, Replay-audited)
- A 心変わり (from the hand): control taken; no restriction; Tribute candidate; Tribute Summon of ホルスの黒炎竜 LV6 with it
  (it goes to its owner's GY); it attacks directly for 2000; returns at the End Phase.
- B 洗脳 (fixture): 800 LP, no restriction, the journaled `FX_CONTROL` records `restrictS03` = none.
- C 精神操作: cannot declare an attack, not a Tribute candidate, journaled `restrictS03` both; returned at the End Phase
  with the flags cleared.
- D Replay compatibility: a legacy `FX_CONTROL` without `restrictS03` still restricts; with `restrictS03` none it does not.
- E X・E・N・O (Flip Summon): the taken monster attacks directly past ビッグ・シールド・ガードナー; returns at the End Phase.
- F ラージマウス attacks directly past ワイト (300), no replay; negative: ジェネティック・ワーウルフ's direct attack is refused.
- Negative control on the U116 build: A, B, C (journal), D, E, F fail.
- Related tests re-run on the U117 build (every test naming control changes, direct attacks, Replay, cannotAttack /
  cannotTribute or these cards — 248 files): 0 FAIL (only the recorded `cycle32` noise).

## Status
- 精神操作 IMPLEMENTED → TESTED. 心変わり / X・E・N・O / ラージマウス stay TESTED (now covered on the real path).
  洗脳－ブレインコントロール is a fixture only (its target restriction is not verified here) and stays IMPLEMENTED.
- TESTED 2166 → 2167, IMPLEMENTED 120 → 119.

## Deferred
- トラップ・スタン / 王宮のお触れ: a trap already on the chain is not negated when it resolves after them; and trap
  activation is refused while they apply although by rule only the effect is negated.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 13716 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `bda43364cfc91f6258d5b3044c4c04050e3e7f7bd6f954968f6d4018d114eb8c`; Acode not regenerated
  (`dist/battle_acode.html` `c0bfdbba…`).
- Coverage: TESTED 2167, IMPLEMENTED 119, ENGINE_GAP 610, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1284 (4996);
  122 declared status changes, 0 off-target.
