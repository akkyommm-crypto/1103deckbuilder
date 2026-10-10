# S03-U50 冥府の使者ゴーズ only when damaged + battle-damage events drained after damage calculation (Claude)

Base: `checkpoint_claude_s03_u49_battle_fader_once_per_chain_20260914.zip`, SHA256 `0eb1ec41ac79ab1c40cc6bd54518b24f17b6f76442b1aa4569238a8cacb802f6`.

## How it was found

- R1 【HERO】 vs 1103兎ラギア (fixed lists, responder, 14 duels, U47 build) completed 14 / 14, but the wrong-step review of the ops showed 冥府の使者ゴーズ activated from the hand in Main Phase with no damage taken (7 times), e.g. seed `0x52310401` first 0, turn 1, right after 強欲で謙虚な壺 added it.
- The legacy script (cards/00) only checked that the field was empty, and took the token's ATK/DEF from `prompt()`.
- In 2 of Astra's 13 fixed lists (hero, debris). Classification: CARD_WORK on a real-duel illegal step, plus INTEGRATION_MISSING (below).

## 2011 source

yugioh-wiki 《冥府の使者ゴーズ》 age 37 (2011-05-28):
- its Special Summon from the hand is a trigger effect when you take damage from a card the opponent controls while your field (field zone included) has no card; the follow-up is a trigger when that Special Summon succeeds;
- battle damage: a token with ATK/DEF equal to the damage; a monster destroyed by that battle is still on the field when the damage is taken, so only a direct attack leaves the field empty (FAQ);
- effect damage: only from chain link 1 (a later link misses the timing); the same damage is dealt to the opponent; it also works in the Damage Step (10/12/20);
- only one copy is Special Summoned; the burn back is the damage that triggered it.

## Measurement before (U49 build)

- `tools/test_s03_u50_gorz.js`: **4 PASS / 5 FAIL** — legal from the hand with no damage; never offered on a direct attack or on effect damage; effect-damage LP actions carried no source.

## Closure

- **New `cards/HB_claude_s03_u50_gorz.js`** (after HA in the manifest; replaces the legacy definition by name): a v4 hand trigger on `onBattleDamage` (direct attack from the opponent) or `onLPChange` (effect damage from the opponent at chain link 1), with an empty field; a forced trigger on its own Special Summon creates the token or deals the same damage. No prompt.
- **Effect-damage source (engine):**
  - `engine/1R` `beginLinkResolutionS03` also records the resolving link's player, uid and `chainLinkOne` (the chain is empty after `CHAIN_RESOLVE_TOP`); module variable only;
  - `engine/40` `API.damageLP` stamps `byPlayer`, `sourceUid` and `chainLinkOneS03:true` (link 1 only) on new `LP` actions while a link resolves;
  - `engine/00` the `LP` reducer passes `chainLinkOneS03`, and `emitLpChangeV28` adds it to `onLPChange` only when true (existing payloads and old Replay packages unchanged).
- **Battle-damage events drained after damage calculation (engine/30, found while closing the test):** the `ATTACK` reducer queued `onLPChange` / `onBattleDamage` / `onDirectBattleDamage`, but the Damage Step went on to the “after damage calculation” window without draining them; they waited for an unrelated later flush. The calculate stage now enqueues `DRAIN_EVENTS` before that window. Existing battle-damage card tests called condition / operation directly and never took this path; among the fixed lists only 冥府の使者ゴーズ consumes these events.
- **Status:** 冥府の使者ゴーズ IMPLEMENTED → TESTED. **tools/check.py:** the U50 test after U49.
- **Test** `tools/test_s03_u50_gorz.js`, **after: 9 PASS / 0 FAIL**:
  - A: no damage → no hand activation, legality refuses;
  - B: direct attack by ワイト → ゴーズ Special Summoned, token ATK/DEF 300; Replay ok;
  - C: a set card on the field → not offered;
  - D: ファイヤー・ボール at chain link 1 → the LP action records the source; ゴーズ Special Summoned; the same 500 back; Replay ok;
  - E: damage the controller deals does not offer its own ゴーズ.
- **Regressions on the final build:** test_battle_cards 170 / 0, test_scheduler_cards 77 / 0, test_lp_change_v18 43 / 0, test_lp_change_cards 44 / 0, U20 16 / 0, U21 11 / 0, U25 13 / 0, U26 11 / 0, U29 14 / 0, U39 9 / 0, U40 18 / 0, U44 9 / 0, U45 9 / 0, U46 26 / 0, U47 15 / 0, U48 9 / 0, U49 7 / 0, R1 gate 44 / 0. サディスティック・ポーション (reads `byPlayer`, previously treating a missing source as its own): `test_auto_cycle30.js` 70 / 0.

## Real-duel effect

- **【HERO】 vs 1103兎ラギア**, Astra's fixed lists, responder, seeds `0x52310401`–`0x52310407` × both first players, U50 build (600 s scratch harness): **14 / 14 completed**, Replay ok in all 14, blocker none, unsupported [] (6–29 s per duel).
- 冥府の使者ゴーズ in the ops: **0 hand activations** (was 7 in the U47 sweep). It triggered 3 times, always in the Battle Phase right after a direct attack (`0x52310401` first 0 turn 8 after ジェムナイト・パール; `0x52310403` first 0 turn 10 and `0x52310406` first 1 turn 3 after 魔導戦士 ブレイカー), each followed by its forced token trigger.
- 【BF】 vs 兎ラギア remains 14 / 14 from the U49 measurement (no BF card consumes the changed events).

## Gate

- `python tools/check.py` — EXIT 0, **12688 PASS / 0 FAIL**, no Traceback (log `s03_u50_full_gate.log`).
- The two `ReferenceError` lines in the log (c1ElementOnField, isEffectNegated) are pre-existing (also in the U45–U49 logs).

## Source hash

`339dc8914c53e32bb525dc4576df840685b0a2d8f726f50a3a7b680044569aa9` (727 files, excluding dist/ and *.log; this report set aside).

## Design choices without a ruling found / remaining

- ゴーズ and the token are Special Summoned in attack position (the OCG lets the player choose defense).
- 冥府の使者ゴーズ was not declared in the U47 Special Summon effect table (its own summon was thought chain-less); the 2011 source shows it is a trigger effect — it now declares `includesSpecialSummon` itself.
