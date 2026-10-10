# S03-U129 — スケープ・ゴート (activation-turn summon lock, 4 zones, sheep not Tribute material) + 闇の誘惑 (send, not discard)

## Why
Scouting the single-copy IMPLEMENTED cards in the fixed lists. Measured on U128:
- スケープ・ゴート
  - 「このカードを発動するターン、自分はこのカードの効果以外ではモンスターを召喚・反転召喚・特殊召喚できない」 was not enforced:
    no check on activation, no lock afterwards, and the log wrongly said 「このターン融合召喚できない」.
  - With fewer than 4 free zones it summoned as many sheep as fit; it needs 4.
  - 「このトークンはアドバンス召喚のためにはリリースできない」 was missing: the sheep could be Tributed for a Tribute Summon.
- 闇の誘惑
  - With no DARK monster in the hand it **discarded** the hand (FX_DISCARD). The text says 「墓地へ送る」, so 「捨てられた場合」
    effects such as 魔轟神獣ケルベラル fired wrongly.
  - The banish choice could be cancelled, but the banish is mandatory.

## Change
- `engine/00_state_actions.js`
  - A per-turn record `temporaryFlags.summonedThisTurnS03` is set by the actual Normal Summon (NORMAL_SUMMON; not by a Set),
    by a Flip Summon (FX_SET_STATE with flipSummon) and by a Gemini Summon. Special Summons are already recorded in `ssHistory`.
  - TOKEN_CREATE carries `noAdvanceTributeS03`.
- `engine/40_legal_script_engine.js`
  - `v46FaceUpSummonRestrictionReason` refuses Normal / Flip / Gemini / procedure summons, and (via the Special Summon
    restriction) Special Summons, while `temporaryFlags.noSummonS03` is set.
  - `API.createToken` passes `noAdvanceTributeS03`.
- `engine/70_summon_procedures.js`: `tributeCandidates` excludes `noAdvanceTributeS03` monsters. Other releases (costs,
  Synchro Material …) are unaffected.
- `cards/00_generic_core.js` スケープ・ゴート
  - Activation needs 4 free zones and no Normal / Flip / Special Summon earlier this turn.
  - Resolution creates exactly 4 DEF sheep (none if 4 zones are no longer free), then sets `noSummonS03` + `noSpecialSummon`
    for the turn.
  - `declareActivationNegatedReleaseS03(..., {noSpecialSummonWhileChained:true})` (the U34 mechanism).
- `cards/20_control_counter.js` 闇の誘惑: `API.sendHandToGrave` (FX_HAND_SEND_GRAVE) for the no-DARK branch; the banish choice
  is `cancelable:false`.

## Test — `tools/test_s03_u129_scapegoat_foolish_lure.js` 18/0 (real DUEL path, Replay-audited)
- A: legal with 5 free zones; illegal with 3 free zones, and after a Normal, a Special (死者蘇生) or a Flip Summon this turn.
- B: 4 羊トークン in DEF. Afterwards the Normal Summon is no longer offered, a forced Normal Summon is refused (message),
  死者蘇生 is illegal and a Flip Summon is refused. The lock is gone the next turn.
- C: the sheep are not Tribute candidates.
- D: a hand of 魔轟神獣ケルベラル plus 2 drawn spells → all 3 sent to the GY by FX_HAND_SEND_GRAVE, with no FX_DISCARD, so
  ケルベラル does not trigger. With a DARK monster in the hand, the banish choice is not cancelable.
- Negative control on U128: 10 of the 18 fail (A ×4, B forced summon / flip, C, D ×3).
- Pre-scan of all 348 gate tests on the U129 build (parallel): 0 FAIL.

## Status
- スケープ・ゴート IMPLEMENTED → TESTED, 闇の誘惑 IMPLEMENTED → TESTED. The focus is registered, so the 大嵐 and 魔轟神獣ケルベラル
  mentions do not promote them. TESTED 2193 → 2195, IMPLEMENTED 107 → 105.
