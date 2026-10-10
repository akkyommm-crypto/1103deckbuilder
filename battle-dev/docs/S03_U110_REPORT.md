# S03-U110 — 大天使クリスティア (Archlord Kristya): all four clauses fixed, central "Deck top instead of GY" replacement

## Why this card
Priority #7 IMPLEMENTED tier, main-deck qty=2 tier (fixed list `major_decks_v1_agent.txt`: `大天使クリスティア x2`),
first candidate after the qty=3 tier closed in U107. Base: clean U109 (`6e24e7ad…`).

## 2011 text (old wording; the project's carddata.json holds the current wording, same substance)
自分の墓地に存在する天使族モンスターが4体のみの場合、このカードは手札から特殊召喚する事ができる。
この方法で特殊召喚に成功した時、自分の墓地に存在する天使族モンスター1体を選択して手札に加える。
このカードがフィールド上に表側表示で存在する限り、お互いにモンスターを特殊召喚する事はできない。
フィールド上に表側表示で存在するこのカードが墓地へ送られる場合、墓地へ送らずデッキの一番上に戻す。

## Defects found (all four clauses)
1. **① summon was an activated effect.** `activateFrom:['hand']` made the hand Special Summon a chain link
   (respondable as an effect). It is a chain-less summon procedure.
2. **② add-to-hand was optional and non-targeting**, done inside the same `resolve()` with `cancelable:true`.
   It is a mandatory trigger that targets ("選択して") and only on the ①-method summon.
3. **③ the mutual Special Summon lock was log-only** (`API.log("…お互いに特殊召喚できない")`); nothing enforced it.
4. **④ the Deck-top replacement did not exist.**

## Fix
- `cards/10_themes_a.js`: `summonProcedure:{from:'hand', positions:['atk','def'], condition}` (exactly 4 Fairy
  monsters in the own GY); `forced:true, targets:true` trigger keyed on `onSpecialSummon` with
  `event.kind==='procedure'` (the kind `doSpecialFromZoneUidV370` already emits); target re-checked at resolution
  and added with `API.returnToHand` (respects GY locks). `leaveFieldToDeckTopS03:true` declares ④.
  The legacy `s03u62.christia-bounce` choice handler stays registered for old saves.
- `engine/40_legal_script_engine.js`: 大天使クリスティア joins 虚無魔人 / フォッシル・ダイナ パキケファロ in the
  face-up mutual lock of `v46GlobalSpecialSummonRestrictionReason` (already consulted by every Special Summon
  path: API.specialSummon, summon procedures, EX summons, script legality); negation via `effectNegated`.
- `engine/00_state_actions.js`: new `s03DeckTopInsteadOfGraveU110(gs, card, preLoc, preFace)` +
  `s03DeckTopReplaceGraveU110(...)` next to the existing `v350BanishWhenLeavesField`. Judged at the pre-leave
  location/face (effectNegated uses locateCard, so after leaving it could not see Skill Drain). Wired into every
  field→GY path: MOVE, FX_TO_GRAVE (effects and Advance Summon tributes), FX_WIPE_ZONE, BATTLE_CLEANUP,
  EX_SUMMON_PREPARE_V42 synchro materials, FX_EX_SUMMON synchro/fusion materials, FX_RITUAL_SUMMON tributes,
  control-return overflow (two sites). When it applies the card never reaches the GY, so no `onSendToGrave`,
  no `graveInfo`; `onDestroy` still fires when it was destroyed. Placed via the existing owner-aware
  `returnToOwnerDeckOrExtra` (top = index 0, face-down).

## Test — `tools/test_s03_u110_archlord_kristya.js` 34/0 (real DUEL path)
- A: procedure offered with exactly 4 Fairy monsters (a non-Fairy ignored); not offered with 3, 5, or with the
  Fairy monsters in the opponent's GY; never offered as an effect activation.
- B: real procedure summon; the mandatory trigger targets only the 4 Fairy monsters; a real cancel attempt does
  not skip it; the target is added to the hand; exactly one CHAIN_ADD (the trigger), none for the summon; lock
  for both players; own サイバー・ドラゴン procedure no longer offered.
- C: the opponent's real 死者蘇生 is illegal while Kristya is face-up; legal without it (control).
- D1–D7: replacement via 地砕き (FX_TO_GRAVE), サンダー・ボルト (FX_WIPE_ZONE, the other monster still goes to the
  GY), battle, Advance Summon tribute; face-down → GY; under スキルドレイン → GY and no lock; opponent-controlled →
  the owner's Deck top.
- E: revived by 死者蘇生 → no trigger (not the ① method), lock applies.
- Every segment Replay-audited clean.
- Negative control: the same test against the pre-fix U109 build fails in all four clauses (12 assertions + a
  thrown missing-choice error).

## Real-duel regression
- Fixed-list agent vs dark / hero / six / rabbit, both first players: 8/8 completed normally, Replay ok,
  unsupported 0, blocker null. Kristya was drawn in some of these duels but its procedure never became legal
  (exactly 4 Fairy monsters in the GY did not occur), so these duels are a regression check, not a real-duel
  exercise of the new behavior; that coverage is the dedicated DUEL-path test above. A seed hunt for a duel
  that reaches the procedure was started and stopped to keep the Full Gate uncontended (4 more duels, no summon).

## Gate
- Full Gate EXIT 0, 13473 PASS lines (U109 13439 + 34), 0 FAIL, no Traceback / ReferenceError; the single
  caught `TypeError` stack at the start of `test_auto_cycle32.js` is the recorded existing noise.
- Coverage: IMPLEMENTED 131 → 130, TESTED 2153 → 2154; status audit 109 declared changes, 0 off-target.

## Status
- 大天使クリスティア IMPLEMENTED → TESTED (declared change #109).
