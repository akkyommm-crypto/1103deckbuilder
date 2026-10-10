# S03-U183 — 剣闘獣の闘器, 剣闘獣の戦車, 剣闘獣の底力

## Engine (engine/1ZZB_equip_substitute_arms_s03.js)
- Mandatory equip substitute (`equipSubstituteS03:true` on an equip spell): 「装備モンスターが破壊される場合、代わりにこのカードを破壊する」 is
  decided inside FX_TO_GRAVE, FX_WIPE_ZONE and BATTLE_CLEANUP (Replay-safe): the face-up, not-negated equip is destroyed instead and the
  monster stays; the Damage Step cleanup no longer emits battle-destruction events for a monster that stayed.
- 「装備モンスターが自分フィールド上からデッキに戻る事によってこのカードが墓地へ送られた時」: `dropEquips(P, card, gs, 'deck')` from the
  FX_RETURN_DECK reducer marks the equip's graveInfo (hostToDeckS03) when the monster returned from the equip controller's field;
  `armsReturnTriggerS03(ctx)`.

## Cards (NOT_STARTED → TESTED)
グラディウス (+300), マニカ (not destroyed by battle), デーモンズシールド (mandatory substitute), ハルバード (Spell / Trap destruction after the
equipped monster attacked), 剣闘獣の戦車 (Counter Trap: negate a monster effect activation), 剣闘獣の底力 (+500; GY recycle).

## Tests
`tools/test_s03_u183_gladiator_arms.js` 17/0 (real DUEL paths, Replay-audited). The shared 闘器 return-to-hand trigger is exercised with
グラディウス. Negative control on U178: 11 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14845 PASS / 0 FAIL** (= U182 14828 + 17 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U182.
- Coverage: TESTED 2328, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 134 (4996); audit 289 declared, 0 off-target.
