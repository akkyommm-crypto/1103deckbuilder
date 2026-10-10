# S03-U145 — mass destruction is a destruction of each card; 「このカードが…」 triggers only on their own event; the remaining attack-lock cards

## Why
- While testing 古代の機械究極巨人 ③ 「このカードが破壊された場合」 against ブラック・ホール, the trigger never came. The mass-destruction
  action (`FX_WIPE_ZONE`) moved the cards to the GY but did none of what a single destruction (`FX_TO_GRAVE` byDestroy) does. It
  recorded:
  - no `graveInfo` (byDestroy / from / turn / position);
  - no destroyed-this-turn record;
  - no `onDestroy` / `onSendToGrave` / `onRemove` event (only the generic `onLeaveField`).

  So no 「破壊された場合」「墓地へ送られた時」 trigger could activate after ブラック・ホール, 激流葬, ブラック・ローズ・ドラゴン or
  神獣王バルバロス. The affected cards include ダンディライオン, ネフティスの鳳凰神, 機械犬マロン and every card that checks
  `graveInfo.byDestroy`.
- Fixing it exposed a second defect. Leave-field events are broadcast to every card: each script's passive handler decides, and the
  battle events' `selfOnly` flag is never read. Two scripts about "this card" did not compare the event's card with themselves:
  - ダンディライオン: `onSendToGrave → zone==='grave'`;
  - the shared helper `c1EffectDestroyedGrave`, used by 機械犬マロン, ネオフレムベル・ヘッジホッグ and ネフティスの鳳凰神.

  As a result, a ダンディライオン already in the GY made 2 more tokens whenever *another* monster was destroyed by battle or sent to
  the GY. With two cards destroyed at once, ネフティス activated twice. The negative control reproduces this on U144 in plain battle,
  without any mass destruction.
- The remaining attack-lock cards (U144 follow-up), all NOT_STARTED: 古代の機械獣, 古代の機械工兵, 古代の機械究極巨人,
  E－HERO ワイルド・サイクロン.

## Change
- `engine/00_state_actions.js` `FX_WIPE_ZONE` now treats each destroyed card exactly like `FX_TO_GRAVE` with byDestroy:
  - `graveInfo {turn, from, byDestroy:true, byPlayer, lv, face, pos}`, plus `countersV22` when the card had counters;
  - P3 move provenance and `graveHistory`;
  - `recordDestroyedV30`;
  - in DUEL, deferred `onDestroy` / `onSendToGrave` (when in the GY) / `onRemove` events.
- New `engine/1ZP_self_event_s03.js`: `eventIsSelfS03(ctx)` is true when the event names this card. It is now used by:
  - ダンディライオン (`cards/00_generic_core.js`);
  - `c1EffectDestroyedGrave` (`cards/B4_auto_cycle12.js`) for `onDestroy`.
- `API.specialSummon` gets the new option `opts.ignoreSummonConditionS03` for 「召喚条件を無視して特殊召喚する」. It skips the card's own
  summon conditions: the U126 「〜でしか」 rule, the U127 proper-summon rule, and 「特殊召喚できない」 in the `FX_SPECIAL_SUMMON`
  reducer. Player-level restrictions still apply.
- New `cards/HZB_claude_s03_u145_attack_lock2.js`:
  - 古代の機械獣: `cannotSpecialSummon`, the lock (U144), and U25's battle-destroyed negator (as 漆黒の魔王 LV4).
  - 古代の機械工兵:
    - ① U28 targeting negator: Trap effects are negated and the Trap destroyed, for both players' Traps.
    - ② the lock.
    - ③ a forced `dsTiming:'end'` trigger that destroys 1 targeted opponent Spell/Trap. It needs the card still face-up in the
      Monster Zone: if the attacker was destroyed by that battle, it is no longer on the field when the Damage Step ends.
  - 古代の機械究極巨人: the lock, piercing, and ③ an optional trigger on its own `onDestroy` (from the GY or banished) that revives
    古代の機械巨人 with `ignoreSummonConditionS03`. Its 「融合召喚でしか特殊召喚できない」 is already enforced by U126.
  - E－HERO ワイルド・サイクロン: the lock, and ② a forced `onBattleDamage` trigger that destroys every opponent Spell/Trap that is set
    (face-down). Its 「ダーク・フュージョンの効果でのみ」 is already enforced for Fusion Spells (U130) and revival (U127).

## Test — `tools/test_s03_u145_mass_destroy_attack_lock.js` 36/0 (real DUEL path, Replay-audited)
- W:
  - ブラック・ホール destroys ダンディライオン and ネフティスの鳳凰神. ダンディライオン makes exactly 2 tokens; ネフティス activates exactly
    once and schedules its revival.
  - `graveInfo` and the destroyed-this-turn record are written.
  - A ダンディライオン already in the GY does nothing when another monster is destroyed by battle.
  - 機械犬マロン destroyed together with ワイト deals 1000 once.
- A — 古代の機械獣:
  - Locked while it attacks.
  - キラー・トマト destroyed by battle has its recruit negated. Control: destroyed by デーモンの召喚, it recruits.
  - 死者蘇生 cannot target it.
- B — 古代の機械工兵:
  - 強制脱出装置 targeting it is negated and destroyed. Control: targeting ワイト returns ワイト to the hand.
  - Locked while it attacks.
  - ③ destroys the chosen サイクロン; ③ is not activated when 工兵 is destroyed by that battle.
- C — 古代の機械究極巨人:
  - Locked while it attacks; 4200 piercing damage.
  - Destroyed by ブラック・ホール, it Special Summons 古代の機械巨人. Control: 死者蘇生 still cannot target 古代の機械巨人.
  - A 究極巨人 that was never properly summoned cannot be revived.
- D — E－HERO ワイルド・サイクロン:
  - Locked while it attacks.
  - 1600 battle damage destroys both set cards; the face-up 一族の結束 stays.
  - No battle damage, no destruction.
  - Not usable in the Main Phase.
- Negative control on U144 (`dist/battle.html` + this test): 20 FAIL, 0 errors.

## Not in this unit (recorded)
- The same "not about this card" defect may exist in other legacy scripts that handle `onSendToGrave` / `onDestroy` /
  `onBattleDestroy` / `onRemove`. A systematic audit is the next unit.
- `graveInfo.byPlayer` (the destroying player) is `null` for effect destruction in DUEL, for single and mass destruction alike.
  `destroyerPlayerV30` reads `gs.chain`, which no longer holds the resolving link. Cards that need "destroyed by the opponent"
  (幸運の鉄斧, スクラップ・ツイン・ドラゴン's revival …) are affected. This is a separate follow-up.
- A・ジェネクス・トライフォース needs the attributes of its Synchro materials recorded at the summon (`v380SummonMaterials` has name /
  level / ATK / DEF only).

## Status
- NOT_STARTED → TESTED: 古代の機械獣, 古代の機械工兵, 古代の機械究極巨人, E－HERO ワイルド・サイクロン.
- TESTED 2218 → 2222, NOT_STARTED 1259 → 1255.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14228 PASS lines, 0 FAIL, no Traceback / ReferenceError (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- Pre-scan of all 364 gate tests (parallel) before the gate: 0 FAIL, every exit code 0.
- `dist/battle.html` SHA256 `3026affd80a91f0c4587242463e646b2d26059f88440bc005ee43bde261f8f1c` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `715ded7f1788e6826daeab0343bd712d28d0c5a8243dc8b7cb443512d0d3ce63`.
- Coverage: TESTED 2222, IMPLEMENTED 94, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1255 (4996);
  189 declared status changes, 0 off-target.
