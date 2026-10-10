# CAPABILITY_NOTES

Contracts touched by Claude S03 units. Small, per-contract. Not a full map.

## C-S03-01 DECK_TO_HAND_LOCK (ライオウ ①) — S03-U01

- meaning: while an active source applies, a player cannot add cards from the Deck to the hand by any method other than drawing.
- producer: `CARD_SCRIPTS[name].continuous.lockDeckToHand(p, src)` (true / function). Current producer: ライオウ (`cards/00_generic_core.js`).
- source validity: `continuousSources()` — face-up, not individually negated, not activation-pending, monster sources filtered by continuous negation (スキルドレイン). No new state.
- query: `deckToHandLockReasonV32(p)` in `engine/40_legal_script_engine.js` → reason string or ''.
- consumers:
  - resolution: `API.searchDeck`, `API.deckToHand` emit no Action while locked (log only; journal unchanged → Replay consistent). `runAutoEffect` search op (legacy AUTO_EFFECT UI) gated.
  - activation legality: `strictScriptLegalityV2` — script flag `blocksIfNoDeckToHand` (true or function(ctx)). Response lists (`getChainResponsesV2`) and hand actions inherit it.
  - card-specific: 強欲で謙虚な壺 (locked at resolution → chosen card to GY via FX_MILL, rest shuffled), エアーマン (search mode not offered while locked).
- not gated (by design): MANUAL-mode free tools (`runtime/50_actions_save.js` manual search menu, `deckTopPick`).
- lifecycle/persistence: derived every query from board; Undo/Redo/SaveLoad need nothing extra (verified by test incl. second VM).
- historical basis:
  - 1103裁定DB R1103-RAIOH-004 (historical_source_confirmed): optional search that must add from Deck cannot be activated; mandatory effects activate but do not add; draw allowed; 封印の黄金櫃 can be activated.
  - R1103-RAIOH-005: スキルドレイン negates the lock.
  - 2011 wiki snapshots: ガジャルグ cannot be activated (09/07/05); if ライオウ appears in chain, neither search nor discard applies (09/08/29). ラヴァルバル・ドラグーン same (11/05/10). 栄誉の贄 cannot be activated (10/09/07). アームズ・ホール can be activated, cannot add from Deck (08/06/15). 水晶の占い師 / 魔導雑貨商人: excavated card that would be added goes to GY (09/03/02).
  - KONAMI current Q&A (1103-era card pairs): 増援・テラ・フォーミング cannot be activated; 強欲で謙虚な壺 cannot be activated; if ライオウ arrives in chain, the chosen card goes to GY and the other 2 are shuffled back.
- text difference: DB text equals 2011 wording for ライオウ.
- tests: `tools/test_s03_u01_raioh_lock.js` (real activation / choice / chain / battle / Undo-Redo / second-VM continuation / Replay audit).
- S03-U04 additions (recovery part A):
  - **Trigger offering.** `collectHandlers` (DUEL) skips optional triggers whose `blocksIfNoDeckToHand` applies. The check goes through `triggerBlockedByDeckLockV32(sc,p,ctx)`, which accepts the flag as true or as function(ctx). Before this, SEGOC offered triggers without any legality check, so such a trigger would be offered and then fail when picked.
    - The Special Summon lock (`blocksIfNoSpecialSummon`) is not applied at offering yet. It is queued as a candidate and needs measuring.
  - **Flagged optional search triggers:** ポケ・ドラ, グリーン/レッド/イエロー・ガジェット, 神秘の代行者 アース, ドラグニティ－コルセスカ.
  - **Mode consumers.**
    - 竜の渓谷: the search mode is hidden while locked. The condition then requires a Dragon in the Deck, so the card can still be activated for its mill mode.
    - E・HERO フォレストマン: "Deck or GY" offers only the GY copy while locked, via `v340ForestmanFusion`. Its passive also requires a selectable 融合.
    - Basis: R1103-SIXGATE-009 and アームズ・ホール 08/06/15, applied by analogy (inference).
  - **Mandatory excavation.** Under the lock, 魔導雑貨商人's Spell/Trap goes to the GY. 水晶の占い師's chosen card goes to the GY and the other card to the bottom, via the handler arg `lockToGrave` (2009-03-02 wiki). The pending choice persists in a second VM.
  - Test: `tools/test_s03_u04_lock_recovery.js`.
- Dependent classification (U04 examination):
  - ① remaining → U05: E－エマージェンシーコール, スクラップ・エリア, 神の桎梏グレイプニル, 化石調査, 墓守の司令官, ヘカテリス, 魔轟神グリムロ.
    - Also 調律: the mill must happen only after a successful search (current KONAMI Q&A in the rulings DB).
    - Also 光の援軍: the 3 milled cards are an activation cost (reviewed ruling), and it needs a Deck of at least 4.
  - ②: 天空の使者 ゼラディアス (its self-destroy effect is unverified), 六武の門 and 暗黒界の術師 スノウ (legacy closure choices, Q5), 封印の黄金櫃 (manual reservation for the later add), アームズ・ホール / 栄誉の贄 (no script).
  - ③: ジェネレーション・チェンジ, サンライト・ユニコーン, リチュア・ディバイナー, エンシェント・フェアリー・ドラゴン.
  - not yet examined: AUTO_DECK_TABLE `op:'search'` entries (58, PARTIAL coarse helper), TG ラッシュ・ライノ, TG サイバー・マジシャン.
- unresolved / follow-up:
  - remaining optional pure-search scripts are not yet flagged (they are still blocked at resolution, but may be activated): see WORK_QUEUE (U05).
  - AUTO_DECK_TABLE `op:'search'` entries: flag by optional/mandatory needs per-card review.
  - 強欲で謙虚な壺 reveals at activation (selectTargets) rather than at resolution — pre-existing inaccuracy, not changed.

## C-S03-02 PER_EFFECT_COUNT_LIMIT — S03-U02

- meaning: a 「1ターンに1度」 limit can belong to one effect of a multi-effect card. Activating that card's other effects neither checks nor consumes the limit.
- declaration: `countLimit:{n, scope, effects:[v4EffectKey...]}`. Without `effects`, the existing card-wide behaviour is unchanged.
- helpers (`engine/40_legal_script_engine.js`):
  - `countLimitAppliesV32(sc, effectKey)`;
  - `countLimitEffectKeyV32(name, sc, ctx)` returns `ctx.v4EffectKey`, or selects it via `v4SelectEffectForContext` for unified cards;
  - `countLeft` / `countConsume` / `countConsumePayloadV44` accept `effectKey`.
- consumers:
  - legality in `strictScriptLegalityV2` (`30_processor_chain_battle.js`) and legacy `strictScriptLegality`;
  - the CHAIN_ADD `v44CountConsume` payload, in both the P1.1 descriptor and `finishPrepare`;
  - legacy `runScript` consume and check.
- state / persistence: unchanged. It uses the existing per-card `clTurn/clN` (RULING_1103_PER_CARD_LIMIT) and consumes through the existing CHAIN_ADD Action, so Replay, Undo and SaveLoad need nothing new.
- limitation: one counter per card copy. If a card ever had two separately limited effects, they would share it (none in the current consumers).
- UI lists that call `countLeft` without a key treat effect-scoped limits as available; legality still refuses correctly.
- measured bug before the fix: on the U01 build, Flip Summon ステルスバード → trigger resolves → self-set refused with 「1ターンに1度までです」.
- historical basis:
  - card text 「このカードは1ターンに1度だけ裏側守備表示にする事ができる。このカードが反転召喚に成功した時、…」 limits only the position change;
  - a 2011 wiki Q&A on ステルスバード presupposes returning it face-down by its effect on the turn it was Flip Summoned;
  - ヴァジュランダ (09/09/07 wiki): the equip is a trigger and the ATK doubling is a 1/turn ignition.
- consumers fixed: イナゴの軍勢, ガーディアン・スタチュー, スカラベの大群, ステルスバード, デス・ラクーダ, メデューサ・ワーム, 守護者スフィンクス, 番兵ゴーレム (`self-set`), グレート・スピリット (`self-set-face-down`).
- next consumer: ヴァジュランダ (U03).
- related observation: after a Normal Summon with no responses, or after declining an optional flip trigger, the summon timing window closes and monster ignition effects are legal. The 2011/3/19 ignition rule does not stick.
- tests: `tools/test_s03_u02_effect_count.js`. It covers all 9 cards through a real Flip Summon, the trigger, self-set via the chain, and journal count payloads; a card-wide regression (クリッター); Undo/Redo with the digest match; and a second-VM continuation.

## C-S03-03 SEARCH_THEN_HAND — S03-U03 (card-side shared contract)

- meaning: 1/turn ignition that adds a matching monster from the Deck at resolution, then puts one matching monster from hand into the GY (discard or send).
  - The two steps happen in order.
  - If the lock prevents the add, nothing further happens.
  - It cannot be activated under the lock.
- implementation (`cards/H1_claude_s03_dragunity.js`): no engine change.
  - `S03_SEARCH_THEN_HAND[name]` = `{search, hand, move:'discard'|'send', handTitle}`
  - `s03SearchThenHandEffect(name)`
  - registry handlers `claudeS03.search-then-hand` → `claudeS03.search-then-hand-move`, whose args are only `{player, name}`
  - `API.searchDeck` return value used as the lock gate
  - `blocksIfNoDeckToHand:true`
- consumers:
  - ドラグニティナイト－ガジャルグ (Dragon/Winged Beast, discard).
  - ラヴァルバル・ドラグーン (Laval, send).
- rulings:
  - ガジャルグ 09/07/05 (in order; not under ライオウ) and 09/08/29 (lock in chain → neither).
  - ラヴァルバル・ドラグーン 11/05/10 (lock at resolution → neither).
- persistence: the pending Deck choice resumes in a second VM with a matching digest (test).
- tests: `tools/test_s03_u03_dragunity.js`.

## C-S03-04 RESOLVED_SPELL_TO_GY — S03-U07 (closed)

- **Status (U07):** implemented as planned below. Gate 11789 PASS / 0 FAIL. Test `tools/test_s03_u07_spell_to_grave.js` (32 PASS).
- **Producer of the exception:** a script flag `remainsOnFieldAfterResolve:true`. Current producer: 光の護封剣.
- **② dependent:** 大進化薬 (ENGINE_GAP, no script). A carddata scan finds it is the only other non-Continuous Spell/Trap with 「発動後…フィールドに残り」 text; it needs the flag when it is scripted.
- **Legacy scripts:** already went to the GY, so the new step is a no-op for them. Regression: 心変わり.
- The U05 temporary exemption for 化石調査's location was removed.

Design notes from planning (kept for reference):

- **Meaning:** by game rule, a Normal, Quick-Play or Counter Spell, or a Normal or Counter Trap, is sent to the GY after it resolves.
- **Measured defect (U05 build):** unified cards whose effect declares `afterResolve(){}` stay face-up in the S/T zone.
  - Probed: 化石調査, スタンピング・クラッシュ, トレード・イン, 太陽の書, 調和の宝札, アドバンスドロー, 援軍, 押収.
  - 増援 (legacy, no `afterResolve`) and 天使の施し (its handler sends it) do go to the GY.
- **Cause:** `afterPreparedResolve` (`engine/30_processor_chain_battle.js`) runs `sc.afterResolve` when it exists, and only otherwise `selfToGrave`. The unified adapter always has an `afterResolve`, which calls the effect's empty one.
- **Scope (heuristic scan):**
  - 309 unified non-keep Spells and Traps with an empty effect `afterResolve` and no self-finish. All are TESTED.
  - 108 legacy scripts with an empty `afterResolve` on non-keep Spells and Traps.
- **Planned fix:** add `settleResolvedSpellTrapV32(link,ctx,sc)` after the existing `afterPreparedResolve` body. It sends the card with `FX_SELF_TO_GRAVE` only when every condition holds:
  - the link is not `keep` (Continuous, Field and Equip are excluded);
  - the card is a Spell or Trap;
  - the card is still face-up in `sz` or `field`;
  - it has no `equipTo`;
  - its script does not declare `remainsOnFieldAfterResolve`.
- **Exceptions checked:**
  - Intentional stays: 光の護封剣 needs the flag. くず鉄のかかし sets itself face-down, so the face-up check skips it.
  - Become Equip Cards: D－チェーン, アサルト・スピリッツ, サディスティック・ポーション, 幻獣の角 (`equipTo` check).
  - Move themselves: チェーン・ブラスト, チェーン・ヒーリング.
  - No script, not affected: 大進化薬, 王家の財宝, 無欲な壺.
- **Timing convention (unchanged):** `afterPreparedResolve` runs synchronously right after `resolve`, even if `resolve` opened a registry choice. Legacy spells already go to the GY at that point. The fix follows the same convention.
- **Persistence:** no new state. The move is a journaled Action.
- **Test draft:** scratchpad `test_s03_u07_spell_to_grave.draft.js`.
  - Unified spells: 調和の宝札, トレード・イン, 太陽の書, アドバンスドロー, 押収, 強引な番兵, 化石調査.
  - Unified trap: 援軍. Legacy spell: 心変わり.
  - Stay on field: 光の護封剣 and 団結の力.

## C-S03-05 JOURNALED_CARD_FLAGS — S03-U08

- **Meaning:** any card-state field or player flag written while an effect is activated or resolved must be written by a journaled Action. Otherwise the Replay audit cannot reproduce the live digest, because:
  - `v41CardDigest` includes every primitive card field;
  - player `temporaryFlags` and `effectFlags` are part of `v41PlayerDigest`.
- **Found by:** vertical slice #1. レスキューラビット set `rabbitEndDestroyTurn` directly, giving a digest mismatch at its second FX_SPECIAL_SUMMON. That is the second action because the first write happened after the first action's digest was recorded.
- **API and Actions:**
  - card fields: `API.setCardFlag(t, flag, value, reason, {silent})` → `FX_CARD_FLAG_V46` (`value` null/false deletes; `silent:true` suppresses the log line);
  - player flags: `API.setFlag(p, key, value, temporary)` → `PLAYER_FLAG_SET_V42`.
- **Converted card-script sites (28):**
  - エフェクト・ヴェーラー, 禁じられた聖杯, シャイニング・アブソーブ (`negatedUntilTurn`)
  - ゾンビキャリア, バトルフェーダー, ボルト・ヘッジホッグ, 魔天使ローズ・ソーサラー (`banishWhenLeavesField`)
  - デブリ・ドラゴン, BF－大旆のヴァーユ (`negated`)
  - スポーア, レベル・スティーラー, 魔轟神レイヴン (`lvMod`)
  - ジュラック・グアイバ, 六武衆－ヤイチ (`cannotAttack`)
  - 禁じられた聖槍 (`spearProof`), 光の護封壁 (`wallValue`), 超融合 (`fusionMaterialCount`)
  - レスキューラビット (`rabbitEndDestroyTurn`); the v340 end-destroy helper used by 天罰 / 真六武衆－ミズホ / 真六武衆－エニシ (`v340EndDestroyTurn`)
  - カラクリ大将軍 無零怒, 鬼ガエル, トラゴエディア ×3, ブラック・ローズ・ドラゴン, BF－精鋭のゼピュロス, 諸刃の活人剣術, ライトロード・マジシャン ライラ (per-card turn markers)
- **Player flags:** 鬼ガエル `v370FrogExtraNormal`, BF－暁のシロッコ `v350OnlyAttackerUid`.
- **Engine:** `resolveReservedEffectsV30` `levelResetUids` now clears its expiry flag with a silent `FX_CARD_FLAG_V46` instead of `delete`.
- **Invariant, enforced by lint** in `tools/test_s03_u08_journaled_flags.js` (no card names):
  - card scripts contain no direct write of a ZONE_LOCAL_KEYS / known state field / `v###…` marker, and no direct player-flag write;
  - the reserve processor does not `delete` card flags.
  - Excluded: comments and `CARD_SCRIPTS[...]` definition-level properties such as `attackLimit`.
- **Historical source-shape assertions** were widened to accept the journaled form; their intent is unchanged: test_effect_negation:82, test_expansion_v350:46/55, check.py 'v3.5 leave-field banish' and 'Effect Veiler cost before resolve'.
- **Engine-side direct writes (classified; not in this unit):**
  - reducer-side, fine: ensureBattlePermissionV6, ensureLinkStateV9, clearExpiredProtV21, applyGraveEquipV31, reconcileEquipLinksV31, activatePendingProcedureBaseStats;
  - non-DUEL legacy paths: cardCountConsume (legacy runScript), cancelBattle, doAttack before its DUEL early return;
  - not yet examined: applyNormalSummonMethod (70_summon_procedures), protConsumeV21, flippedFaceDownV9, the provenance attach helpers (indirect callers).
- **Persistence:** no new state. The flags were already JSON state; only the write path changed. SaveLoad was verified in a second VM (トラゴエディア ④).
- **Tests:** `tools/test_s03_u08_journaled_flags.js`, covering:
  - the lint;
  - レスキューラビット (including the End Phase destroy), 鬼ガエル ③, BF－暁のシロッコ, ボルト・ヘッジホッグ (including banish on leave), トラゴエディア ④ (including the End Phase reset);
  - a Replay audit after each step;
  - silent logging;
  - the VM2 continuation.

## C-S03-07 MANUAL integration — S03-U31

- **Scope.** C-S03-07 (card activation vs effect activation) was implemented only in the DUEL pipeline. MANUAL and DEVELOPER share their own routes and had neither the split nor the P1.1 choice chain, so a declared Field/Continuous card activated from the hand ran its effect with no mode choice, no cost, and the effect's 1/turn consumed (user report, 《竜の渓谷》).
- **Sites (generic; no card names in the engine).**
  - `activateFromHand` (engine/60): after the MOVE, `cardActivationOnlyV32(nm, sc, db, to, placed, {cardActivation:true})` → log the card activation and return. Else, a script with `activationV11` → `prepareDuelActivation(nm, p, to, idx, {noPriority:true})`. Else → legacy `runEffect`.
  - `activateFromZone` (engine/70): evaluate `cardActivationOnlyV32` **before** flipping a face-down card (a set card's activation is a card activation); after the flip, a card activation logs and returns; a P1.1 script goes through `prepareDuelActivation`; everything else keeps `runEffect`.
  - `commitPreparedActivationV11` (engine/30): when `PLAY_MODE !== PLAY_MODES.DUEL`, call `resolveWholeChainV2()` so the committed link resolves — outside DUEL nothing else enqueues `SOLVE_CHAIN`.
- **Gate for which cards.** The existing `declareCardActivationFreeV32` table. Measured: 歯車街 (declared Continuous Spell, set) → card activation; 六芒星の呪縛 (undeclared, takes a target) → legacy route.
- **② Remaining.** `handActivate` (MANUAL 「発動（チェーンへ）」) hand-rolls `CHAIN_ADD` without `cardActivationOnly` / `cardActivationS03`; MANUAL card activations create no chain link, so responses to them are not modelled; DEVELOPER shares the routes without its own test.
- **Tests.** `tools/test_s03_u31_manual_card_activation.js` (MANUAL). The DUEL route stays covered by `tools/test_s03_u30_ui_activation_paths.js`.

## C-S03-06 TRIGGER_OFFER_LEGALITY — S03-U09

- **Meaning:** in DUEL mode, a SEGOC offer shows a trigger only if picking it now would pass activation legality.
- **Implementation:** after its existing filters, `collectHandlers` (`engine/40_legal_script_engine.js`) calls `strictScriptLegalityV2(name, p, zone, index, …)` and skips the candidate when the result is not ok.
  - The existing filters are: `summonNegate` exclusion, passive handler, count limit, summon/flip applicability, and the deck lock (U04).
  - Options:
    - `cardOverride` and `logicalZone` (`'mz'` when a flip is treated as on the field);
    - `event`, `eventName`, and `battle` / `step` / `battleOpponent` from the damage-step context;
    - `ignoreTiming:true`.
  - These are the same options that `eventPickV2` → `prepareDuelActivation` uses.
  - MANUAL mode is unchanged.
- **Why it matters:**
  - Optional groups can be skipped, but an illegal optional offer is still a dead choice.
  - Forced groups (rank < 2) cannot be skipped (`eventSkipGroupV2` returns). The pick of an illegal candidate only toasts, so the duel stalled.
- **Measured before the fix:** 聖なる魔術師 flipped by attack with no Spell in its GY, and 闇霊使いダルク with no DARK monster, each stalled in a forced group.
- **Scan:** 120 of 433 self summon/flip triggers were offered but illegal (34 forced). 66 rows with the generic unified reason are likely artifacts of the synthetic event.
- **Battle-flip timing:** the engine offers a battle-flip trigger in the damage step while the monster is still in mz. This is consistent with 2011 rulings (深淵の暗殺者 11/08/12, レプティレス・スキュラ 09/10/21, メタモルポット); no change.
- **Not in scope:** chain-response lists (`getChainResponsesV2`) are a separate path.
- **Persistence:** no state; the filter is derived on every offer.
- **Tests:** `tools/test_s03_u09_offer_legality.js`, covering 奈落 (not offered / offered), 聖なる魔術師 (no target / target) and 闇霊使いダルク (no target), each with a Replay audit.

## C-S03-07 CARD_ACTIVATION_VS_EFFECT — S03-U10

- **Meaning.** For a Continuous Spell, Field Spell or Continuous Trap whose text puts no requirement on activating the card itself:
  - activating it from the hand or from a face-down set is a **card activation only**. No effect condition, count limit, cost or target applies; resolving it applies no effect; the card stays face-up.
  - Its effects are activated or applied separately once it is face-up.
  - Rulings (2011 wiki): 竜の渓谷 10/07/04; 神の居城－ヴァルハラ; コア転送ユニット / 擬似空間 10/09/23 (the effect cannot be activated at the same time as the card). インフェルニティガン is the stated exception (not scripted).
- **Declaration:** legacy `fieldIgnition:true`, or `declareCardActivationFreeV32([...names])` in `cards/H2_claude_s03_card_activation.js` (the reviewed table).
  - Nothing is auto-detected, because unified cards can carry real activation conditions inside non-ACTIVATE effects (ゴブリンの小役人, 便乗).
- **Engine** (`engine/30_processor_chain_battle.js`):
  - `cardActivationOnlyV32(name, sc, db, zone, card, opts)` is true for a declared Continuous/Field S/T when the zone is `hand`, the card is face-down in `sz`/`field`, or `opts.cardActivation` is set. `duelActivateFromHand` passes that flag after moving the card.
  - `strictScriptLegalityV2` returns ok (`cardActivationOnly:true`) right after the trap-negation check.
  - `prepareDuelActivation` computes the flag before flipping the card; it skips `activationV11` / cost / targets and calls `finishPrepare` with no count-consume payload.
  - `CHAIN_ADD` carries `cardActivationOnly:true`, which the reducer copies to the link only when true.
  - `resolveOnePreparedLinkV27` skips `resolve` / `afterResolve` for such links and logs the activation. Spell-counter observers still apply, since a Spell card was activated.
- **SEGOC** (`collectHandlers`): card-activation-only candidates (for example a set declared Continuous Trap) are not offered as trigger candidates. They stay activatable as chain responses (`getChainResponsesV2` / `getLegalZoneActions`).
- **Unchanged:** the effect path from the face-up zone (`getLegalZoneActions` 「⚡ 効果を発動」, `prepareDuelActivation` with a face-up card).
  - Chain-response reachability of face-up declared cards still depends on `hasFieldActivatableEffect`, which requires `fieldIgnition` for legacy scripts. That gap is noted.
- **Measured.** On an empty board, scripted Continuous/Field S/T that can be activated as cards went from 51/188 before to 155/188 after.
  - The 31 still refused are the 30 cards whose activation has a real requirement (target, cost, declaration, activation condition), plus 光のピラミッド ②.
  - 光のピラミッド: its ACTIVATE operation links the Sphinxes present at activation, so it needs a model change.
- **Not in scope:** F5, where activating 御前試合 / 群雄割拠 throws `r.violations is not a function`; マクロコスモス's optional activation-time Special Summon.
- **Persistence:** the only new state is the link flag, which is written by the journaled CHAIN_ADD Action.

## C-S03-08 EXCLUSION_RESTRICTION — S03-U11

- **Meaning.** While 御前試合 (`key:'at'`) or 群雄割拠 (`key:'ra'`) is face-up, a player whose face-up monsters have 2 or more distinct values of that key must keep one kind; the rest go to the GY.
  - No chain block is made.
  - It runs in the rules pass after committed actions (`enforceExclusions`), and at step ⑤ of the damage step.
- **Restriction shape.** A script's `restriction` is `{key, jp}` (v4.6 / v49 unified form), optionally with a legacy `violations()` method.
  - `exclusionViolations()` uses `violations()` when present; otherwise it calls `exclusionViolationsByKeyV32(key)` (same rule).
  - The v4.6 face-up summon restriction (`v46ActiveFieldRestrictions`) reads only `key` / `jp`.
- **Cause of the defect.** The v49 unified redefinition dropped the legacy `violations()`, so the rules pass threw on every action while the card was face-up.
- **Test caution.** `tools/test_v460_native_cards.js` stubs `enforceExclusions`, so tests of this path must not stub it. See `tools/test_s03_u11_exclusion_restriction.js`.
- **Persistence.** No new state. `EXCLUSION_PENDING` / `EXCLUSION_RESOLVING` are UI re-entrancy guards; the send to GY is a journaled `FX_TO_GRAVE`.

## C-S03-09 CHAIN_RESPONSE_SPELL_SPEED — S03-U12

- **Meaning.** Chain windows and POINT (response) windows list only Spell Speed 2+ activations.
  - A Spell Speed 1 activation happens only in an open game state: the controller's own Main Phase, empty chain, through the zone and hand actions.
- **Where.** `getChainResponsesV2` (`engine/30_processor_chain_battle.js`) pushes a source only if `ss>=top` **and** `ss>=2`, where `ss = scriptSpellSpeed(sc, db)`. `pointResponsesV27` uses the same list, plus its damage-step filter.
- **Spell speeds.** `scriptSpellSpeed`:
  - Trap: 2 (Counter Trap: 3)
  - Quick-Play Spell: 2
  - other Spells: 1
  - monster with `quickEffect`: 2
  - otherwise: `priority`
- **Before the fix.** S/T were filtered only by `ss<top`. Face-up 六武の門 / 六武衆の結束 / 暗黒界の門 / カラクリ解体新書 / 神の居城－ヴァルハラ effects were offered in the opponent's chain windows and summon POINT windows.
- **Next (U13).** Spell Speed 2 on-field effects of face-up Continuous Traps are still unreachable through `hasFieldActivatableEffect`, which requires `fieldIgnition` and rejects unified cards. Widen that gate only now that the Spell Speed ≥ 2 rule is in place.
- **Out of scope.** The MANUAL-mode `reactableCards` list.
- **Test.** `tools/test_s03_u12_response_spell_speed.js`, including a name-free invariant sweep.

## C-S03-10 FIELD_EFFECT_RESPONSE_REACHABILITY — S03-U13

- **Meaning.** When a face-up Continuous Trap has a Spell Speed 2 on-field effect that is legal right now, that effect is offered in chain windows and response (POINT) windows.
- **Gate.** `hasFieldActivatableEffect(card)` in `engine/20_effect_primitives_ex.js` decides whether a face-up S/T can enter the response lists at all. For scripted cards it returns true when the script has `resolve` and one of these holds:
  - legacy `fieldIgnition`;
  - legacy script declared card-activation-free (U10 table) with no `passive` trigger design;
  - unified card with a native IGNITION or QUICK effect;
  - unified card with a native ACTIVATE effect whose events include `activate`, and the card is declared card-activation-free.
  - If the count limit is used up, it returns false (unchanged).
- **Filters that still apply** (`getChainResponsesV2`): `strictScriptLegalityV2`, `ss≥top`, and `ss≥2` from U12.
- **Not admitted.**
  - Unified Traps whose ACTIVATE effect is the card's own activation (e.g. 正統なる血統): a face-up card is never re-activated.
  - Trigger-only designs, which go through SEGOC.
- **Why U12 had to come first.** Without the `ss≥2` rule, widening this gate would have listed Spell Speed 1 Spell effects as responses.
- **Tests.** `tools/test_s03_u13_field_effect_response.js`:
  - reachability of 零式魔導粉砕機, 強制終了 and 木遁封印式;
  - controls: 正統なる血統 and ヴァルハラ;
  - one response activation, with Replay.

## C-S03-36 LEGACY_CHOICE_PICKED_DB — S03-U45 (found by R1 on Astra's fixed lists, 六武衆 vs 1103兎ラギア)

- **Rule.** A choice candidate resolved for a continuation has the same `{p, zone, index, uid, card, db}` shape as `API.fieldCards` / `API.pileCards` results. Legacy `API.selectCard` callbacks (and registry handlers) can read `picked.db` in DUEL.
- **Engine.**
  - engine/09 `choiceResolveCandidateV49` adds `db` in both the uid branch and the coordinate branch.
  - Replay-safe: `CHOICE_ANSWER_V49` journals only the keys, and `serializeChainSelectionV2` strips `db` from chain selections.
  - Restored `ctx.selectedTargets` already had `db` (`findCardByUidInState`).
- **Why it broke.** Outside DUEL the old picker passed `{card, db}`, so these cards passed their tests. In DUEL the ChoiceRequest pick had no `db`, and callbacks such as 六武衆の荒行's `v340SixDeck(... a.db.n ...)` threw "Cannot read properties of undefined (reading 'n')".
- **Measured.**
  - Test 2 / 3 fail before → 5 / 0 after.
  - 六武衆 vs 兎ラギア, seeds `0x52310301`–`0x52310307` × both first players (responder): 2 / 14 complete before → 13 / 14 after.
- **Consumers.** Legacy `selectCard` callbacks reading `.db` of the picked card (upper-bound scan: 121 sites across themes, e.g. 六武衆の荒行, スポーア, 真六武衆－カゲキ, E・HERO ボルテック).
- **Same unit, same cause class (a chosen card left its zone before resolution, so the restored selection is `null`).**
  - 諸刃の活人剣術 now Special Summons only the remaining target (2011 ruling 11/08/03).
  - 六武衆の荒行's chosen Deck monster: guard pending.
- **Tests.** `tools/test_s03_u45_legacy_choice_picked_db.js`; R1 driver `R1_DECKS=six,rabbit`.

## C-S03-35 TRIGGER_FORCED_PER_EFFECT — S03-U44 (found while implementing U43)

- **Rule.** In DUEL SEGOC, whether a trigger is forced is decided per candidate, from the effect that triggers. A unified card may have an optional and a forced trigger (e.g. ドラグニティ－アキュリス). Forced triggers go in groups 0 / 1 and cannot be skipped; optional ones go in groups 2 / 3.
- **Engine.**
  - `engine/1ZB_trigger_forced_per_effect_s03.js` `triggerCandidateForcedS03(c)`: for a v4 unified script with any `forced:true` effect, use `v4SelectEffectForContext(name, candidate ctx with its event)` and that effect's `forced`, or `sc.forced`. Otherwise use `sc.forced`.
  - engine/40 `startEventChainV2` (rank and forced flag) and the non-DUEL forced auto path use it.
  - No new state or Action.
- **Measured.**
  - Test 5 / 4 fail before → 9 / 0 after.
  - Before, skipping チュウボーン's forced flip trigger removed it: no tokens were created, a wrong result.
  - The 29 test files naming the 28 consumers are unchanged versus the U43 baseline.
- **Consumers (28).** 悪魔の知恵, ガードペナルティ, D・コード, チュウボーン, アイヴィ・ウォール, ナイトメア・デーモンズ, スネークポット, サボウ・ファイター, 魔法吸収, 暗黒の呪縛, 連鎖炸薬, 王立魔法図書館, バベル・タワー, 魔法の操り人形, ブラッド・マジシャン－煉獄の魔術師－, ナチュル・トライアンフ, 天空聖者メルティウス, 救済のレイヤード, 人造天使, ナチュル・ビートル, 闇の芸術家, 勇気の砂時計, D・レトロエンジン, 鉄の騎士 ギア・フリード, 士気高揚, ドラグニティ－アキュリス, …
- **② Remaining.** engine/30 `effectClassV2` (a display label) still reads `sc.forced`; legacy `defineScript` cards keep the script-level flag (unchanged).
- **Tests.** `tools/test_s03_u44_trigger_forced_per_effect.js`.

## C-S03-34 FLIP_TIMING_WINDOW_SCOPE — S03-U42 (found by R1-v1, Astra's fixed lists)

- **Rule.** Only a Flip Summon opens the `'flip'` timing window, the 2011/3/19 priority rule that blocks monster ignition effects until both players pass. A set Spell / Trap turned face-up by its activation, and monsters turned face-up by battle or by effects, are not summons and leave the open state unchanged.
- **2011 sources.** yugioh-wiki 「起動効果」 age 82 (2011-05-23) and 「優先権」 age 69 (2011-07-28).
- **Engine.**
  - `runtime/50 updateTimingWindow` (run by `act()` and by the Replay runner) opens `'flip'` for `FX_SET_STATE` only when `zone:'mz'`, face-up, and `flipSummon:true` or reason `反転召喚成功` / `反転召喚` (older journals).
  - The Flip Summon commits carry `flipSummon:true`: engine/40 `runSummonWindowResumeS03` and runtime/50 `doFlipUp` (Attack Position).
  - `timingWindow` is not in the state digest, so old Replay packages keep their digests.
- **Measured.**
  - Test 8 / 5 fail before → 13 / 0 after.
  - Fixed-list sweep (48 duels): 3 refused ignition effects in 2 duels before (`0x52310101` turn 3, レッドアイズ・ダークネスメタルドラゴン / ドラグニティナイト－ガジャルグ after the opponent's 強制脱出装置; `0x52310106` turn 28).
- **Kept reproduction condition.** Driver `R1_LIST=v1` with `data/r1_lists/major_decks_v1_*.txt`; gate case `0x52310101`; `known_gaps_v1.json` (only 未来融合 is tolerated as unsupported).
- **Tests.** `tools/test_s03_u42_flip_timing_window.js`; `tools/test_s03_r1_duel_completion.js` case `0x52310101` (fixed lists v1).

## C-S03-33 RESOLUTION_CHOICE_SUMMON_EVENT — S03-U41 (found by the R1 48-duel sweep)

- **Rule.** In DUEL, when a chain link's resolution opens a choice (`requestChoice` registry or legacy), processing waits for the answer. The summons and other events the answer causes are processed at their timing (Special Summon success timing → response window → open state) before the chain ends. Lower links resolve only after the upper link's choice is answered. This holds across save / resume while the choice is open.
- **2011 sources.** yugioh-wiki 「起動効果」 age 82 (2011-05-23) and 「優先権」 age 69 (2011-07-28): after a summon / Special Summon priority is passed first, then ignition effects are allowed. Special Summon success timing exists after chain processing (11/07/27).
- **Engine.**
  - `engine/1Z_resolution_choice_wait_s03.js`:
    - `resolutionChoiceWaitS03`;
    - `resumeAfterResolutionChoiceS03` (no choice open and the processor waiting on `SOLVE_CHAIN` → `processorResumeV27`);
    - `resolutionWaitMetaS03` (`{chainLeft}` when the choice opens while `SOLVE_CHAIN` is current);
    - `restoreResolutionChoiceWaitAfterLoadS03`.
  - `engine/30` `processSolveChainV27` queues the continuation as before and returns WAIT while a choice is open.
  - `engine/09`: `dispatchChoiceContinuationV49` resumes after the registry handler, the legacy pick and the legacy cancel; `requestChoice` records `meta.resolutionWaitS03` inside `CHOICE_OPEN_V49`, so Replay matches.
  - `runtime/50` `offerResumeDuel`: loading discards the processor. For a registry resolution choice carrying that meta, the continuation is queued again and waits (`ADJUST`+`SOLVE_CHAIN` if links remain, else `ADJUST`+`CHAIN_END`+`DRAIN_EVENTS`).
  - No new gameState key, no new Action.
- **Measured.**
  - Test 5 / 8 fail before → 13 / 0 after.
  - Sweep before: 13 of 48 duels, 55 phase changes with an undrained `onSpecialSummon`.
  - R1 case `0x52310024` / 兎ラギア first: 2 refused ignition effects before.
- **② Remaining.**
  - Legacy `openPick` choices inside `resolve` that bypass `requestChoice` are not covered.
  - `CHAIN_AFTER_V2` closures are still lost across a save.
  - A legacy (closure) resolution choice saved mid-answer is still released on load (existing behaviour).
- **Tests.** `tools/test_s03_u41_resolution_choice_summon_event.js`; `tools/test_s03_r1_duel_completion.js` case `0x52310024` (no ignition effect refused after the summon timing).

## C-S03-31 ATTACK_DECLARATION_RESPONSE_WINDOW — S03-U40 (found by R1 responder mode)

- **Rule.** At the attack-declaration window (processor POINT `kind:'attackDeclare'`) a response is legal when its card text allows it at 「（相手）モンスターの攻撃宣言時」. The attacking player cannot use a 「相手モンスターの攻撃宣言時」 card against its own attack.
- **Engine.**
  - `engine/1Y_attack_declare_window_s03.js`: `attackDeclareWindowS03()` is true while `pendingAttack` exists and the attack-declaration POINT is the waiting **or current** processor unit.
    - `processPointV27` counts responses while the unit is `processorCurrent`; with none it auto-passes without pausing, so checking only `processorWaiting` never opened the window.
  - `attackDeclareResponseOptsS03(name, opts)` returns `eventName:'onAttackDeclare'` + `event {player, atkIdx, attackerUid, targetUid, target, name}`.
  - `getChainResponsesV2` and `prepareDuelActivation` recheck a refused response with those opts; if legal, the activation runs with that event. Cards already legal (強制脱出装置 etc.) are unchanged. No new gameState key.
- **Cards.** 聖なるバリア －ミラーフォース－, 次元幽閉, 速攻のかかし now require `pendingAttack.player === ctx.opponent`.
- **Measured.** Defender offers 6 → 15 of 37. U40 test before 12 / 6 fail, after 18 / 0.
- **② Remaining (C-S03-32 ATTACK_DECLARATION_INFO, INTEGRATION_MISSING):**
  - 魔法の筒 reads `gameState.battle` (null until the damage step);
  - ディメンション・ウォール, 地縛霊の誘い, 立ちはだかる強敵 use `API.battleContext()`, which reads `gameState.battle`;
  - BF－バックフラッシュ, フォーチュン・スリップ read `pendingAttack.target`, not in the shape `{player, attackerUid, targetUid, name, defenderSnapshot}`;
  - 速攻のかかし has no `quickEffect`, so it is never offered from the hand.
  - Not gaps: own-attack effects (墓守の暗殺者, デーモン・カオス・キング, ランサー・デーモン, ヴァイロン・ソルジャー); direct attack only (バトルフェーダー); hand or board conditions (ヒーロー見参, デプス・アミュレット, スーパーチャージ, コアキメイルの障壁, 細胞爆破ウイルス, 生贄の抱く爆弾, ダーク・フォース, シャイニング・フォース, ナチュル・バタフライ); trigger, not a POINT response (インターセプト・デーモン).
- **Tests.** `tools/test_s03_u40_attack_declaration_window.js`.

## C-S03-30 ATTACK_STATE_JOURNAL — S03-U39 (found by R1 responder mode)

- **Rule.** The attack in progress (`pendingAttack`, `attackNegated`) and the End-Phase expiry of runtime effects change only through Actions. Both are in the state digest.
- **Attack.**
  - `ATTACK_DECLARE_V48 {pending}` sets `pendingAttack` and clears `attackNegated` in the reducer. Records without `pending` behave as before.
  - `ATTACK_PENDING_CLEAR_S03 {reason}` is used for every exit of `processAttackV27` (negated, attacker gone, no direct attack, damage step), for `battleReplayCancelV28` and for `v350EndBattlePhase`.
  - `ATTACK_PENDING_RETARGET_S03 {targetUid, defenderSnapshot}` is used by `battleReplayPickV28`.
  - Attack negation from scripts goes through `API.negateAttack` (`NEGATE_ATTACK_V45`); No.39 希望皇ホープ and くず鉄のかかし were converted.
- **End Phase.** `processEndPhaseV30` journals `V4_EFFECT_RESET_S03 {event:'endPhase'}` when an effect with `RESET.END` exists. The reducer runs `v4ResetRuntimeEffects`. Phase and turn resets already run inside `applyAction` (`v4OnActionApplied`).
- **POINT responses.** The UI path is `pointActivateV27`, which reopens the POINT after the chain. Calling `duelActivateResponseV2` directly at a POINT leaves the attack un-continued (a driver / test rule).
- **② Remaining.**
  - MANUAL `doAttack` (engine/70) writes `attackNegated` directly.
  - The runtime/50 load normalisation clears `pendingAttack`.
  - 攻撃の無力化 (v4 unified, event `onAttackDeclare`) is not offered through `getChainResponsesV2` at the POINT; to verify.
- **Tests.**
  - `tools/test_s03_u39_attack_state_journal.js`;
  - `tools/test_s03_r1_duel_completion.js` responder cases (seeds `0x52310007`, `0x5231000a`).

## C-S03-29 DUEL_LIFECYCLE_JOURNAL — S03-U38 (found by the R1 real-duel run)

- **Rule.** The duel start (first player, turn 1, Draw Phase) and the duel end (loser, reason) are Actions, so Replay and SaveLoad reproduce a real duel from its first Action to its result.
- **Start.** `startTestDuel`, `startPresetDuel`, `startRabbitOpponentDuel` and the `applyLoad` autostart (`data/80_test_decks.js`) call the existing `SET_FIRST_PLAYER` Action.
  - It sets `activePlayer`, `firstPlayer`, `turn` 1, `phase` draw, `drawnThisTurn` false, `chain` [] and `priority`.
  - Before, these were direct writes after the journaled LOAD_DECK / DRAW, so a Player-2-first duel failed Replay at the first draw.
- **End.** New `DUEL_LOSER_S03 {player, reason}` (engine/00). `markBattleLoserV28` and `adjustStateV27` (engine/30, processor steps) record LP-0 results with it.
  - Before, they wrote `gameState.loser` directly after the ATTACK Action had lowered LP, so every duel decided in battle ended with a Replay `finalDigest` mismatch; only `loser` and `duelEndedReason` differed.
  - The LP Action and DRAW deck-out already set the loser inside their reducers.
- **② Remaining.**
  - `setupPresetBoard` (test presets `barbaros` / `tributeValue`) still pushes cards directly; developer presets only.
  - `data/81_device_smoke_v351.js` and the engine/30 self-tests write turn / phase directly on scratch states (not duel paths).
- **Tests.**
  - `tools/test_s03_u38_duel_lifecycle_journal.js`: the four start paths with Player 2 first, and a battle LP-0 end.
  - `tools/test_s03_r1_duel_completion.js`: runs `tools/r1_duel_driver.js` for two seeded real duels.

## C-S03-28 INTERRUPTED_ACTIVATION_RECOVERY — S03-U35

- **Problem.** The autosave runs 400 ms after every Action. When a Spell/Trap is activated from the hand (MOVE to the zone) or from the set state (FX_SET_STATE face-up), those Actions are journaled **before** the legacy cost / target choice (`API.selectCard` and other closures, `resume.mode:'legacy'`) is answered.
  - A save in that gap resumed with the choice released by `reconcileChoiceAfterLoadV49`, and **the card was stranded face-up with no chain link**.
  - Measured on the U34 build: サイクロン from the hand, a set サイクロン, マジック・ジャマー paying its cost in chain, 増援.
  - About 130 `selectTargets` / `cost` sites in `cards/` use legacy choices.
- **Marker (engine/1X).**
  - `beginActivationPrepS03(p, card, name)` records `{afterSeq}`, the last Journal seq before the activation's first Action.
    - It is called by `duelActivateFromHand` and the hand route of `duelActivateResponseV2` before their MOVE, and by `prepareDuelActivation` after the uid is ensured (it keeps an existing marker for the same card).
  - `requestChoiceV49` (engine/09) copies it into `choice.meta.activationPrepS03` for **legacy** choices only. It is JSON and travels with CHOICE_OPEN_V49, so it is saved and replayed.
  - The marker is cleared:
    - after `CHAIN_ADD` in `finishPrepare`;
    - before the P1.1 path (registry choices are restorable);
    - on a legality refusal;
    - whenever no choice is pending at the end of `prepareDuelActivation` or of a legacy continuation (`settleActivationPrepS03`).
  - **No new gameState key.**
- **Recovery.** `recoverInterruptedActivationAfterLoadS03()` runs in `offerResumeDuel` just before `reconcileChoiceAfterLoadV49`.
  - It acts only on a pending legacy choice that carries the marker, when its closure is gone and `v44ReplayReady` holds.
  - It rebuilds the state from the Journal's initial state through the last entry with `seq <= afterSeq` (Replay Runner, digest-checked), adopts that prefix (`v44ReplayAdoptPrefix`), and applies the same processor normalisation as a load.
    - This also undoes costs already paid.
  - If a chain is still open with the same chain ids, it restores the saved `chainWindow`, which is written directly rather than through an Action and so is not in the Journal.
  - A toast says the unfinished activation was undone.
  - **Fallback:** with a truncated Journal, a digest mismatch or no marker, nothing changes (the pre-U35 release applies).
- **② Remaining.**
  - MANUAL entry points (`activateFromHand` / `activateFromZone` → `askChain` closure → `runEffect`) set no marker, and a save during `askChain` has no pending choice at all.
  - Legacy choices during **resolution** (a released continuation mid-resolution) are not rolled back.
  - Summon-procedure `cost(ctx,done)` closures are not covered (see C-S03-12 for the summon window itself).
- **Tests.** `tools/test_s03_u35_interrupted_activation.js`.
- **MANUAL extension — S03-U36.**
  - Where: MANUAL `activateFromHand` (engine/60) and `activateFromZone` (engine/70).
  - Capture: each records the Journal seq before its first Action — the `MOVE`, or `FX_SET_STATE` face-up.
  - Marker: it is begun **inside the `askChain` continuation**, just before `runEffect`, with that seq, and settled right after `runEffect`. An `askChain` that is never answered therefore leaves no stale marker.
  - Result: a MANUAL legacy cost / target / search choice (e.g. サイクロン, 増援) carries the marker, and the U35 recovery undoes the activation on resume.
  - Measured before on the U35 engine: stranded face-up, and Replay `finalDigest` broken.
  - **② still open:** a save while a MANUAL 「チェーンしますか？」 sheet (`askChain` or `confirmTargets`, a UI closure with no pending choice) is open. Test: `tools/test_s03_u36_manual_interrupted_activation.js`.
- **MANUAL prompt extension — S03-U37.**
  - **Open / close.** `askChain` (cards/40), `confirmTargets` and `askForce` (engine/40) call `notePromptOpenS03()` when they wait, recording `PROMPT_OPEN_S03 = {seq}`. `chainPassed` / `__tgResolve` / `__forceYes` / `__forceNo` call `notePromptClosedS03()`; `__tgResolve` / `__forceYes` then settle the marker, and `__forceNo` ends it.
  - **MANUAL entry points.** `activateFromHand` / `activateFromZone` also call `noteManualActivationPromptS03(p, card, name, prepSeqU36)` before `askChain`, recording `promptSeq`. The continuation clears it before beginning the U36 marker.
  - **Settle.** `settleActivationPrepS03` keeps the marker while `PROMPT_OPEN_S03` is set.
  - **Save.** `saveDuel` writes `interruptedPromptS03 = interruptedPromptSaveMetaS03()` into the save payload, outside gameState and the digest. The meta is returned only if:
    - a prompt is open;
    - no V49 choice is pending;
    - the current Journal seq still equals the prompt's seq (**nothing happened after the prompt**);
    - a marker exists (the U35 / U36 activation marker, or the MANUAL prompt marker with the same `promptSeq`).
  - **Why the seq guard.** The 「チェーンする」 buttons (`openReact`) never clear the pending continuation. Without the guard, a save taken after the opponent reacted would roll that reaction back.
  - **Resume.** `offerResumeDuel` passes `d.interruptedPromptS03` to `recoverInterruptedActivationAfterLoadS03(savedPromptS03)`, which uses it when no choice is pending.
  - **② still open:** a MANUAL prompt that is opened outside an activation (for example around a summon) carries no marker and is not rolled back.
  - Test: `tools/test_s03_u37_manual_prompt_interrupted_activation.js`.

## C-S03-27 ACTIVATION_NEGATED_RELEASE — S03-U34

- **Rule (2011 wiki 《強欲で謙虚な壺》, revision of 2011/08/25).**
  - 10/04/17: the top three cards are revealed and one is chosen **at resolution**. The revealed and chosen cards are public, and the Deck is shuffled afterwards.
  - 10/05/18: no Special Summon in chain to its activation (e.g. 緊急テレポート).
  - 10/05/19: if its **activation is negated** (e.g. 神の宣告), the player **can Special Summon** that turn and **can activate another copy**.
- **Declaration.** `declareActivationNegatedReleaseS03(name, {count, noSpecialSummonWhileChained})` (engine/1W).
- **Count release.** `activationNegatedReleaseS03(link)` runs in the activation-negated branch of `resolveOnePreparedLinkV27` (engine/30), after the U29 and U33 hooks.
  - For a `count` card it rebuilds the CHAIN_ADD payload with `countConsumePayloadV44` and journals `COUNT_REFUND_S03`.
  - The reducer (engine/00) decrements the name store (`temporaryFlags` / `effectFlags`, deleting a zero key) or the per-card `clN` / `clDuel`.
  - **No new gameState key and no new chain-link field.**
- **Chained lock.** `chainedActivationNoSpecialSummonS03(p)` is consulted by `v46GlobalSpecialSummonRestrictionReason` (engine/40). An own, not-activation-negated link of a `noSpecialSummonWhileChained` card refuses Special Summons; the card's `resolve` still sets `noSpecialSummon` for the rest of the turn.
- **Declared.** 強欲で謙虚な壺 (cards/00_generic_core).
  - Its `selectTargets` / `revealPick` (a closure chosen at activation, before the chain link existed) is replaced by a resolution-time V49 choice with handler `s03u34.pot-pick`, which survives save / load.
  - The U01 ライオウ branch (the chosen card goes to the GY) is kept in the handler.
- **② Remaining.**
  - Other 「1ターンに1枚しか発動できない」 cards — オーバー・レンチ, 無欲な壺, 限定解除 (NOT_STARTED), 魔力掌握 (PARTIAL), 黒羽の宝札 — are not declared and have no 2011 negation ruling checked.
  - 黒羽の宝札 sets `noSpecialSummon` in its cost, so it stays locked even if its activation is negated (unverified ruling).
  - The deck dropping below three cards **during** resolution is not path-tested.
  - The generic CHAIN_RESOLVE_TOP log says 「効果は手動で処理してください」 even for automatic resolutions (pre-existing, cosmetic).
- **Tests.** `tools/test_s03_u34_pot_resolution.js`; `tools/test_s03_u01_raioh_lock.js` updated to the resolution-time choice.

## C-S03-26 DRAW_REPLACEMENT — S03-U33

- **Rule.** 「自分のドローフェイズ時に通常のドローを行う代わりに…」 is a trigger effect (2011 wiki 10/06/11) chosen **at the normal draw, instead of drawing** — never a Main Phase effect. Only one card is added even with several copies (09/09/30). **Effect negated → no draw; activation negated → the player draws** (10/03/24). Not activatable with 0 cards in the Deck (10/03/24). Not applied unless the card is face-up at resolution (円盤ムスキー 11/01/10).
- **Declaration.** `declareDrawReplacementS03(name, spec)` (engine/1V). The card needs a string-literal `defineScript` whose `condition` requires `ctx.drawReplacementS03`, a face-up Monster Zone card and a non-empty pool, so it is never offered from the Main Phase menu.
- **Hook.** `processDrawV27` (engine/30), for a DUEL normal draw without `declineReplacementS03`, calls `offerDrawReplacementS03(p)`: face-up declared cards whose activation is legal with `{drawReplacementS03:true}` produce the choice 「通常のドローを行う／「○○」の効果を発動（通常のドローの代わり）」.
  - Choosing the effect journals `DRAW_REPLACED_S03` (sets `drawnThisTurn`; **no new gameState key**), then `prepareDuelActivation(name, p, 'mz', idx, {drawReplacementS03:true})`.
  - Choosing to draw re-requests the DRAW with `declineReplacementS03:true`.
- **Marker.** `drawReplacementS03` is written onto the chain link at both DUEL `CHAIN_ADD` sites only when true (same pattern as `cardActivationS03`, C-S03-25). In the activation-negated branch of `resolveOnePreparedLinkV27`, a marked link calls `drawReplacementActivationNegatedS03(link)`, which performs the normal draw. An effect-only negation applies nothing and draws nothing.
- **Declared (cards/H9).** 無敗将軍 フリード (Level 4 or lower Warrior), ダーク・ジェネラル フリード (Level 4 DARK monster; the card stays PARTIAL by override), 円盤ムスキー (any 「エーリアン」 card). These replace the coarse `AUTO_DECK_TABLE` Main Phase searches.
- **② Remaining.** A second copy cannot be chained to the first (monster triggers are not chain responses); the GY / Field-based cards with the same wording are undeclared; 閃光の宝札's two normal draws are not modelled; MANUAL draws do not pass through this DUEL branch.
- **Tests.** `tools/test_s03_u33_draw_replacement.js`.

## C-S03-25 NEGATED_ACTIVATION_TO_GRAVE — S03-U29

- **Rule.** A Spell/Trap card whose **card activation** is negated is sent to the GY when that chain link resolves. It is not destroyed.
  - 1103 ruling R1103-SUPERVISE-002: 「カードの発動を無効にされた場合、表側表示でフィールド上から墓地へ送られた扱いにならない」 — so its own "sent from the field" triggers do not apply.
- **Marker.** `cardActivationMarkerS03(db,zone,card,opts)` (engine/1U) decides, **before a set card is turned face up**, whether the activation is a card activation: a Spell/Trap activated from the hand (`opts.cardActivation` / `opts.onAbort`) or from the set state (`card.face==='down'`).
  - `prepareDuelActivation` computes it; both DUEL `CHAIN_ADD` sites write `cardActivationS03:true` **only when true**, and the CHAIN_ADD reducer (engine/00) copies it onto the link. Existing Replay digests are unchanged.
  - Not a card activation: the activation of an **effect** of a Continuous/Field/Equip card already face-up on the field.
- **Settle.** `settleNegatedCardActivationS03(link)` runs in the activation-negated branch of `resolveOnePreparedLinkV27`, before it returns. If the card is still face-up in the zone it was activated in, `FX_SELF_TO_GRAVE` sends it to the GY: no destruction, no `graveInfo` (so it does not read as sent from the field), and none of FX_TO_GRAVE's field events (onDestroy / onSendToGrave / onRemove).
  - Cards that the negating effect itself moved (ゴブリンのその場しのぎ → hand, 誤作動 → set again) or destroyed (マジック・ジャマー and the other destroying negations) are left alone.
- **② Remaining.** System v9's generic `onLeaveField` (a zone snapshot diff in engine/18) still reports the departure; no 1103 card reacts to a Spell/Trap leaving the field, so it is recorded, not suppressed. Manual / legacy `CHAIN_ADD` paths carry no marker. Keep-type card activations carry the marker but have no non-destroying negation path in 1103 to test.
- **Tests.** `tools/test_s03_u29_negated_activation_to_grave.js`.

## C-S03-24 extension (targets payload + two more declarations) — S03-U32

- **Payload.** `spec.applies({link, srcDb, negator, targets})` now also receives the **decoded target list** of the link (engine/1T). This is what 「このカード1枚を対象にする」 wording needs: a negator can require `targets.length === 1` and that the single entry is itself.
- **Declared (cards/H8).**
  - 無敗将軍 フリード: a **Spell** card's effect targeting it while face-up → effect negated, source destroyed. 2011 wiki (10/06/11): the negation is a continuous effect; Traps and monster effects are not negated. The card stays **PARTIAL** — its draw-replacement effect is still the coarse `AUTO_DECK_TABLE` entry in `cards/40_auto_interpreter.js`.
  - カオス・マジシャン: a **monster** effect targeting **only** it while face-up → effect negated, no destruction. 2011 wiki (08/05/31): negated when this card alone is chosen; when two or more cards are targeted together the effect applies normally. Its whole text is this continuous effect, so its registration refuses activation (the 六武院 pattern from S03-U14), and its ENGINE_GAP override was removed because the stated gap — declarative effect source/type plus single-target metadata — is what this unit supplies. Promoted ENGINE_GAP → TESTED, declared in `data/s03_status_changes.json`.
- **② Remaining.** 大神官デ・ザード needs a per-battle-destruction counter (「1回目」); タイラント・ドラゴン, デス・デーモン・ドラゴン, ドラゴン・ウォリアー, 不死王リッチー, 超電磁稼動ボルテック・ドラゴン, TG ブレード・ガンナー, アルカナフォースEX－THE LIGHT RULER are NOT_STARTED with other unimplemented effects.
- **Tests.** `tools/test_s03_u32_targeting_negation_2.js` — ADチェンジャー as the single-target driver, a real 使徒喰い虫 flip summon as the two-target control, plus Spell/Trap controls.

## C-S03-24 TARGETING_NEGATION — S03-U28

- **Declaration.** `declareTargetingNegatorS03(name, spec)` (cards/H7).
  - `spec.applies({link, srcDb, negator})` returns `{mode:'activation'|'effect', destroySource, reason}` or null.
  - `spec.after({link, negator})` runs after the negation, using Actions.
- **Hook.** `applyTargetingNegatorsS03()` runs right after the DUEL `CHAIN_ADD` in `commitPreparedActivationV11` and in `prepareDuelActivation` `finishPrepare` (engine/30).
  - It decodes the new link's targets (`deserializeChainSelectionV2`). For each Monster Zone target that is a declared negator (not effect-negated) whose `applies` holds, it negates the link with `negateChainLinkV13` (CHAIN_NEGATE_LINK, optional FX_TO_GRAVE) and runs `after`.
  - No chain block is created.
- **Declared.**
  - ミドル・シールド・ガードナー: a Spell card targeting it while face-down → activation negated; `FX_SET_STATE` face-up DEF.
  - アルカナフォース0－THE FOOL: face-up, `e9FoolCoin` 1 → its controller's cards / 2 → the opponent's → effect negated, source destroyed.
- **Rule.** Continuous "this card is targeted" negations are declared here, not as `onActivateSuccess` triggers. Such trigger scripts must be suppressed (C-S03-16).
- **Tests.** `tools/test_s03_u28_targeting_negation.js`.

## C-S03-23 SEGOC_SPELL_TRAP_ORDER — S03-U27

- **Event groups (DUEL).** `startEventChainV2` builds six groups:
  - 0: turn player's forced triggers;
  - 1: non-turn player's forced triggers;
  - 2: turn player's optional triggers;
  - 3: non-turn player's optional triggers;
  - 4: turn player's **Spell/Trap cards** (「〜した時に発動できる」);
  - 5: non-turn player's Spell/Trap cards.

  Spell/Trap candidates are never forced (their groups can be skipped). `processEventGroupV2` walks `st.groups.length` groups.
- **Why.** Trap cards that activate "when" the event happens are chained after the trigger effects of that event. A Spell Speed 2 trap chained first would make the opponent's Spell Speed 1 trigger illegal.
- **Source.** 2011 wiki: 時の機械－タイム・マシーン (「誘発効果がある場合、それにチェーンしての発動」), 奈落の落とし穴 / 激流葬, 落とし穴 vs 氷帝メビウス.
- **Tests.** `tools/test_s03_u27_segoc_spell_trap_order.js`.

## C-S03-22 DAMAGE_STEP_END_AFTER_DESTRUCTION — S03-U26

- **Flow.** `processDamageStepV27` stage 'enter' re-synchronises the battle (`syncBattleIndicesV28`) and ends the damage step when a combatant is no longer in the Monster Zone.
  - **Exception:** `step==='end'` after damage calculation (`b.battled===true`). The end-of-damage-step window (⑥) always opens then, even when ⑤ `BATTLE_CLEANUP` sent a battle-destroyed monster to the GY.
  - Before damage calculation, a combatant leaving still ends the battle.
- **Context at ⑥.** `battleContextV28` uses the battle's uids and falls back to `lastBattle.atkCard` / `defCard` (journaled by ATTACK) for a combatant that left the field. Scripts that need the card to still be on the field must check its zone (e.g. アックス・ドラゴニュート `ctx.zone==='mz'`).
- **Script rule.** An effect of the text form 「ダメージステップ終了時に…」 belongs to `dsTiming:'end'`. A script whose other effect needs a different `dsTiming` cannot currently express both (パワー・ブレイカー, ②).
- **Tests.** `tools/test_s03_u26_damage_step_end_after_destruction.js`.

## C-S03-21 BATTLE_DESTROYED_EFFECT_NEGATION — S03-U25

- **Declaration.** `declareBattleDestroyedNegatorS03(name, {effectOnly=true, condition(destroyerCard, destroyedCard)})` (cards/H6) for 「このカードが戦闘で（によって）破壊した（相手／効果）モンスターの効果は無効化される」.
- **Record.** `BATTLE_CLEANUP` (engine/00) writes `graveInfo.battleNegatorUidS03` on the destroyed card when:
  - the destroyer, identified from the journaled `lastBattle.attackerUidV6` / `defenderUidV6`, was **not** destroyed in the same battle;
  - the destroyer is in the Monster Zone;
  - the destroyer is declared.

  No record is written otherwise, so other battles' digests are unchanged.
- **Effect.** `resolveOnePreparedLinkV27` (engine/30) treats a link as effect-negated (activated, then negated) when all of these hold:
  - its source card is in the GY with that record from the current turn;
  - the recorded destroyer is face-up in the Monster Zone and not effect-negated;
  - `effectOnly` and `condition` hold at resolution.
- **Source.** 2011 wiki: ワーム・ウォーロード (continuous; not in mutual destruction), 漆黒の魔王 LV6 / キラー・トマト (activated effect negated).
- **Declared.** 漆黒の魔王 LV4, ワーム・ウォーロード, エレメント・デビル (EARTH monster face-up on the field).
- **Tests.** `tools/test_s03_u25_battle_destroyed_effect_negation.js`.

## C-S03-20 BATTLE_DESTROY_TRIGGER_TIMING — S03-U23

- **Damage-step steps and battle destruction.**
  - At 'calc' / 'after' (③④) a battle-destroyed monster is still on the field with `battleDestroyed` (C-S03-17).
  - At 'leave' (⑤) `BATTLE_CLEANUP` sends it to the GY, and `onBattleDestroy` / `onDestroy` / `onSendToGrave` are emitted together with `onDamageStep{step:'leave'}`.
- **Declaration rule.** A script receives `onDamageStep` only at its `dsTiming` (default 'leave').
  - A condition that looks at the GY (「破壊し墓地へ送った時」, 「戦闘で破壊された場合」; helpers `c7KilledFoe`, `a3SelfBattleDestroyed`) must use `dsTiming:'leave'`.
  - A condition on the destruction itself (「破壊した場合」 via `battleDestroyed` / `lastBattle.destroyedDef`) may use 'after'.
- **Fixed declarations.** ハイドロゲドン, フレムベル・ヘルドッグ, A・O・J リーサル・ウェポン, ライトニング・ウォリアー, ヘル・ツイン・コップ, ワーム・ウォーロード, 電磁ミノ虫.
- **S03-U24 extension.**
  - Also 'leave': ハイドロ・ジェネクス, ブレイン・クラッシャー, レプティレス・スキュラ, スパイダー・スパイダー, ダーク・パーシアス, and the set traps ブロッサム・ボンバー, カース・サイキック, 時の機械－タイム・マシーン.
  - Set traps with a damage-step timing are offered to their controller as damage-step trigger events (not through the chain-response list).
  - Measured false positives that stay 'after' and work: ダークブレイズドラゴン, ジュラック・スピノス, ヘルウェイ・パトロール, ブルーサンダーT45, アーマード・サイキッカー, ファイナルサイコオーガ, ガスタ・コドル.
- **Tests.** `tools/test_s03_u23_battle_destroy_trigger_timing.js`, `tools/test_s03_u24_battle_destroy_trigger_timing_2.js`.

## C-S03-19 DAMAGE_STEP_TRIGGER_STAT_CHANGE — S03-U22

- **Resolving-block marker.** `resolveOnePreparedLinkV27` (engine/30) calls `beginLinkResolutionS03(link, sc)` before `sc.resolve`. It records `{name, eventName, damageStepOnly}`. `processChainEndV30` calls `endLinkResolutionS03()`. The marker persists across a choice inside the resolution until the next block starts or the chain ends.
- **`canModifyNow` (engine/60) during a battle, in order:**
  1. `damageStepModifyAllowedS03(info)`:
     - trigger block (`eventName` set) → **allowed at every damage-step step**;
     - damageStepOnly block → `info.dsOnly` (until damage calculation);
     - otherwise null.
  2. `ACTIVE_SCRIPT.damageStepOnly` → `info.dsOnly` (manual activation path).
  3. `info.quickMod` (free-chain rule: until before damage calculation).
- **Card rule.** A damage-step trigger that changes ATK/DEF needs no special declaration: being a trigger chain block (`eventName`) is enough. A quick effect that may change ATK/DEF at damage calculation must declare `damageStepOnly:true`.
- **Source.** 2011 wiki — ヘル・ツイン・コップ (ATK rises when its trigger resolves), ファイターズ・エイプ (trigger with a chain block).
- **Tests.** `tools/test_s03_u22_damage_step_trigger_stat_change.js`.

## C-S03-18 BATTLE_CONTEXT_REPLAY — S03-U21

- **Context on the Action.** Every `ATTACK` Action carries `battleCtxS03`: a JSON snapshot of `gameState.battle` at damage calculation (`step:'calc'`). It is taken by `battleContextSnapshotS03` and holds primitives and primitive arrays only; `flippedCard` is stored as `flippedCardUidS03`.
  - Dispatch sites: `engine/30_processor_chain_battle.js` (DAMAGE_STEP calc) and `engine/60_damage_segoc_ui_helpers.js` (manual damage step).
- **Install / restore.** `applyAction` calls `installBattleContextS03(gs,a)` before the reducer and `restoreBattleContextS03` in `finally`. The snapshot is placed only when `gs.battle` is absent (Replay); live play already has it. `gameState.battle` is not in the state digest.
- **Hook rule.** Hooks evaluated inside the ATTACK reducer may read `gameState.battle` (the snapshot's fields: `player`, `atkIdx`, `target`, `atkUid`, `targetUid`, `step`, `battled`, `defPosAtCalc`, `flippedCard`, …). Hooks may not rely on non-primitive fields other than `flippedCard`. For damage hooks, `info.atkCard` / `info.defCard` remain the preferred identity (C-S03-17).
- **Packages without the field** replay as before (no context).
- **Tests.** `tools/test_s03_u21_battle_context_replay.js`.
- **Replay package entries** are `{seq, turn, phase, action, rngBefore, rngState, digest}`. Test filters must read `entry.action.type`, not `entry.type`.

## C-S03-17 BATTLE_DAMAGE_BEFORE_DESTRUCTION — S03-U20

- **Order.** In `processAttack` (engine/00_state_actions.js) battle damage is dealt (③-ⅳ: redirect → `continuous.battleDamage` → v18 LP rules) **before** battle destruction is confirmed (③-ⅴ: `killDef` / `killAtk` set `battleDestroyed`). This holds for attack-position battles and for piercing damage. Ties deal no damage and are unchanged.
- **Why it matters.** `collectSources` skips `battleDestroyConfirmed` cards. A monster that is destroyed in the battle must still apply its own damage text to that battle.
  - 2011 wiki on アマゾネスの格闘戦士: the monster is destroyed; only its controller's damage becomes 0.
- **Consumers.** マジック・ストライカー, レスキュー・ウォリアー, アマゾネスの格闘戦士, モンク・ファイター, ボマー・ドラゴン.
- **Hook rule (Replay).** Inside `battleDamage(info)`, identify the battle from `info.atkCard` / `info.defCard`, not from `gameState.battle`. `gameState.battle` is set outside Actions (engine/60 helper), so reading it inside the ATTACK reducer gives a different result in Replay. ボマー・ドラゴン now uses `info.atkCard` (falling back to `a5IsAttackerCard` only when no `atkCard` is given).
  - ② Other `battleDamage` hooks that read `gameState.battle` (クロスカウンター) are not yet checked under Replay.
- **Tests.** `tools/test_s03_u20_battle_damage_before_destruction.js` (real ATTACK path + Replay per case). Found by `tools/test_s03_vs4_activation_negation_slice.js`.

## C-S03-16 MONSTER_ACTIVATION_RESPONSE — S03-U19

- **Monster responders.** `getChainResponsesV2` scans hand / field / GY / banished monsters with `quickEffect===true`, **or** declared as activation responses (`activationResponseDeclaredS03`, C-S03-15). The usual filters still apply: zone rules (`canActivateFromZone`), speed ≥ 2, and legality with the top link's activation event.
  - Consumers: ネイビィロイド (field), ヂェミナイ・デビル (hand), ジャスティス・ブリンガー (field).
- **Chain-link targets.** `linkTargetsV19` (`API.activationTargets`) also decodes the serialized card refs stored on chain links (`{__yg1103CardRefV2, ref:{uid}}`). Before, it returned `[]` for every real activation.
  - Consumers: ネイビィロイド's 「自分の魔法・罠を対象」, ミドル・シールド・ガードナー, アルカナフォース0－THE FOOL.
- **Late-trigger suppression.** `collectHandlers` skips `onActivateSuccess` for names in `activationLateTriggerSuppressedS03`: the C-S03-15 declared set plus `declareActivationLateTriggerSuppressedS03([...])`.
  - ミドル・シールド・ガードナー and アルカナフォース0－THE FOOL are declared there, so the target decode does not make them late triggers. Their targeting-negation is not yet modelled (②).
- **Tests.** `tools/test_s03_u19_monster_activation_response.js`.

## C-S03-15 ACTIVATION_RESPONSE_EVENT — S03-U18

- **Scope.** Scripts declared with `declareActivationResponseS03([...])` (`cards/H5_claude_s03_activation_response.js`, 21 names). They negate an activation 「…が発動した時、その発動を無効にする」 and read the activation from `ctx.event` in condition and resolve / operation. Engine: `engine/1P_activation_response_s03.js`.
- **Response event.** `activationResponseOptsS03(name, opts)` adds `{event: makeActivationEventV12(gs, topLink), eventName:'onActivateSuccess'}` when a chain exists. It is used by:
  - `getChainResponsesV2` (response legality);
  - `prepareDuelActivation` (covers `duelActivateResponseV2` / `duelActivateFromZone`). `CHAIN_ADD` stores `event`, and `preparedChainContext` gives it back as `ctx.event` at resolution.
  - With no chain there is no event, so the scripts stay illegal.
- **No late trigger.** `collectHandlers` skips declared names for `onActivateSuccess`, so they are never offered after the activation has resolved.
- **Not declared (separate classification).**
  - ミドル・シールド・ガードナー and アルカナフォース0－THE FOOL: reactions to effects that target them.
  - 「発動した時」 responders that do not negate: 反魔鏡, トラップ・リアクター・RR, マジック・リアクター・AID, ウィングド・ライノ, 黒板消しの罠, 地獄の扉越し銃, トラップ・キャプチャー, マジック・キャプチャー.
  - 「発動する度に」 triggers.
- **Tests.** `tools/test_s03_u18_activation_response.js`.

## C-S03-14 CHAIN_LESS_PROCEDURE_DATA — S03-U17

- **Procedure data.** A legacy `summonProcedure.cost(ctx,done)` may set `ctx.procedureDataS03` (JSON) before calling `done(true)`.
  - `finishSummonProcedure` copies it into `pendingSummon.resumeS03.data` (U15), so it survives SaveLoad, Undo and Redo inside the summon-negation window.
- **Post-summon hook.** On commit, `runSummonWindowResumeS03` passes `r.data` to `doSpecialFromZoneUidV370(uid,pos,reason,procedureDataS03)`.
  - Right after the `FX_SPECIAL_SUMMON` Action, and before `onSpecialSummon` is queued, it calls `summonProcedure.afterSummonS03({p,zone,index,card}, data)` when the card is in its controller's Monster Zone.
  - The hook is called only when data was recorded; procedures without data (e.g. キザン) and non-procedure callers are unchanged.
- **Consumers (converted from activated effects).**
  - マジック・ストライカー: banish a GY Spell; no hook.
  - パワー・ジャイアント: send a hand monster of current Level 4 or lower; the hook lowers its level by the sent monster's Level, `permanent`.
  - 異次元の精霊: banish an own face-up monster; the hook schedules `d4.returnBanishedUid` for the next Standby Phase.
  - None of them has `resolve` any more, so the hand offers only the procedure.
- **Known approximations.** The return is a scheduler action, not a chain-block trigger (wiki 10/11/15). パワー・ジャイアント's level drop does not revert when its effects are negated (wiki 10/07/18).
- **Tests.** `tools/test_s03_u17_chainless_procedures.js`; `test_auto_cycle23/25/27` cases were rewritten to the procedure model.

## C-S03-13 COST_SELECTION_FIRST — S03-U16

- **Scope.** Legacy scripts declared with `declareCostSelectionFirstS03([...])` (`cards/H4_claude_s03_cost_selection.js`, 21 names). 異次元の精霊, マジック・ストライカー and パワー・ジャイアント match the code shape but are excluded: their text makes them chain-less Special Summon procedures (異次元の精霊: 2011 wiki 10/11/17 召喚ルール効果), so they must not become chain activations. Their `selectTargets` picks the card used as cost, and their `cost(ctx,done)` reads `ctx.selectedTargets`. Engine: `engine/1O_cost_selection_first_s03.js`.
- **Order** in `prepareDuelActivation`, for declared names only (not card-activation-only links, no `activationV11`):
  1. `selectTargets`;
  2. `costSelectionBeforeS03` (context keys, and uid + zone of each selection);
  3. `cost`;
  4. `costSelectionAfterS03`, which drops selections whose card changed zone (cost cards are not targets) and collects JSON primitives newly written on `ctx` into `ctx.costCtxS03`;
  5. `finishPrepare`.
  - Non-declared scripts keep cost → selectTargets.
- **Chain link.** `CHAIN_ADD` carries `costCtxS03`; the reducer writes it only when non-empty, so earlier digests are unchanged. `preparedChainContext` copies it onto the resolution `ctx` without overwriting existing keys.
- **Abort.** Unchanged: 「コストを払えません」 plus `opts.onAbort`. A set S/T flipped face-up for an aborted activation stays face-up (pre-existing, not changed).
- **Tests.** `tools/test_s03_u16_cost_selection_first.js`.

## C-S03-12 SUMMON_WINDOW_RESUME — S03-U15

- **State.** `gameState.pendingSummon.resumeS03` is the JSON continuation of a summon waiting in the summon-negation window:
  - normal: `{uid, tributes, tributeValue, p3Materials, summonMethod?}`;
  - procedure: `{uid, pos}`;
  - flip: `{uid}`.
  - Synchro/Xyz keep using `pendingExV2`.
- **Continuation.** `commitPendingSummonV2` / `cancelPendingSummonV2` pass `ps` to `window[ps.commit|cancel]`.
  - `__pendingSummonCommit(ps)` / `__pendingSummonCancel(ps)` run `runSummonWindowResumeS03(ps,'commit'|'cancel')`, which performs the same Actions the old closures did.
  - `PENDING_SUMMON_COMMIT/CANCEL` remain only as a fallback for callers without `resumeS03`. No S03 site sets them.
- **UI after load.** `reopenSummonWindowAfterLoadS03()` is called after `offerResumeDuel`, `undo` and `redo`.
  - It shows the sheet (`showSummonWindowSheetV2`, split out of `beginSummonWindowV2`) and never auto-commits, so Undo doesn't re-summon.
  - It returns 'chain' or 'choice' without acting when a negation chain or a choice is pending; the existing resume paths handle those.
- **Old saves without `resumeS03`.** Committing closes the window, logs 「召喚の続きを復元できない…」 and frees the duel flow. The summon itself is not restored.
- **Tests.** `tools/test_s03_u15_summon_window_resume.js`.

## C-S03-11 SUMMON_COUNTER_PLACEMENT — S03-U14

- **Declaration.** A card script declares `summonCounterS03:{kind, n, group, label}`. Engine: `engine/1N_summon_counter_s03.js`, `applySummonCountersS03(gs,item)`.
- **When counters are placed.**
  - At summon success, when the `onNormalSummon` / `onSpecialSummon` event is queued.
  - Three queue sites call the helper: the `EVENT_QUEUE_V31` reducer; the in-action branch of `queueDeferredEventV2`; the `EX_SUMMON_COMMIT_V42` direct push.
  - Placement is inside the same Action, so Journal, Replay and Undo reproduce it.
  - It is not a trigger: no chain link and no SEGOC candidate.
  - DUEL only. Non-DUEL direct `emitEvent` summon paths do not place counters.
- **Counting.**
  - One summon event places n counters if at least one summoned monster in `evt.uid` / `evt.uids` matches, however many match. A simultaneous Special Summon is one event (R1103-SIXGATE-002). Each face-up declaring card gets its own n (R1103-SIXGATE-003). Placement also happens in the Damage Step (R1103-SIXGATE-001, R1103-SIXUNITED-001/003).
  - A monster counts only if it is face-up in the Monster Zone and in `group` (P4 group key; for Six Samurai, `SIX_SAMURAI_NAMED`).
  - The placing card never counts itself.
- **Observers.** Face-up cards in the S/T Zone or Field Zone that are:
  - not `activationNegated`;
  - not effect-negated (`effectNegated`);
  - not waiting on their own card activation (`activationPending` with a `cardActivationOnly` chain link).
- **Maximum.** `counterMaxV22` via `placeCounterUnitsV22`; each unit emits `onCounterPlaced`.
- **Resolution-time cost/declaration lookup (common fix).** `activationLinkForContextV11` now falls back to `ctx.chainLink` when `ctx.chainId` is set but the resolving link has already left `gs.chain`.
  - Consumers: `API.activationCosts` and `API.declared` at resolution.
  - Before the fix, both returned the pending (already cleared) lists, so costs recorded at activation were lost at resolution.
- **Consumers.** 六武の門 (n 2), 六武衆の結束 (n 1, max 2), 紫炎の道場 (n 1), 六武院 (n 1). Scripts are in `cards/H3_claude_s03_bushido.js`.
  - 六武の門: modes chosen through registry handlers `s03u14.gate-mode`, `gate-pay`, `gate-target`, `to-hand`.
  - Counter cost is paid from any own card; a unit choice appears only when two or more cards hold counters.
- **Tests.** `tools/test_s03_u14_summon_counters.js`.

## S03-U06 UI — normal-play 兎ラギア opponent (user request)

- **New state:** `LOAD_DECK` stores `P.loadedDeckV32 = {source:'user'|'test'|'opponentSample'|'unknown', name, main:[card ids], ex:[card ids]}`. It is JSON-safe, persists through SaveLoad, and is journaled.
- **Load sources:**
  - `applyLoad` and `loadSaved` mark `source:'user'`.
  - `startTestDuel` and `startPresetDuel` mark `'test'`.
  - `startRabbitOpponentDuel` marks Player 2 as `'opponentSample'`.
- **Normal opponent start:** `startRabbitOpponentDuel(firstPlayer)`.
  - Requires Player 1 `loadedDeckV32.source==='user'` with at least one main card; otherwise it shows 「先にプレイヤー1のデッキを読み込んでください」 and starts nothing.
  - Rebuilds both decks from the stored lists or the sample through `resetForTestDuel`, `LOAD_DECK`, `SHUFFLE` and `DRAW` 5, for each player.
  - Starts on turn 1 in the Draw Phase.
- **Developer start kept:** `startTestDuel(true,0,'rabbit')` (both sides 兎ラギア), now also listed in `openDeveloperTestPresets`.
- **Labels:**
  - 「兎ラギアと対戦開始」 (hand-empty button and menu).
  - 「1103兎ラギア（対戦相手用）」 (deck list).
  - The historical `check.py` label assertion was updated to the new label at the user's request; its intent is unchanged.
- **Test:** `tools/test_s03_u06_rabbit_opponent.js`.

## S01 GRAVE_EQUIP recovery notes — S03-U03

- The Synchro-success trigger checks `ctx.event.kind==='synchro'` plus `as01SelfEvent`; the EX_SUMMON_COMMIT event carries `uid` and `kind`.
- New consumers:
  - ヴァジュランダ (single target, Lv3-or-lower Dragon Dragunity).
  - バルーチャ (any number, capped by free zones; partial resolution; no equip if zones are short at resolution).
- ヴァジュランダ's ignition cost is chosen through registry handler `claudeS03.vajrayana-cost`. Any equip card on the host qualifies, including one the opponent controls. Its limit is `countLimit:{n:1,effects:['double']}` (C-S03-02).
- ATK doubling = `API.modAtk(self, curATK, 0, 'endTurn')`, a fixed value until end of turn. Expiry is verified through the real End Phase and turn change.
- Remaining ② dependents: ミスティル (procedure-cost closure, Q5), レヴァテイン, プリムス・ピルス (equip from Deck), ヴァイロン・エプシロン, ヴァイロン・オメガ.

## C-S03-37 SHARED_USE_AND_SPECIAL_SUMMON_EFFECT_LINK (S03-U46, closed — checkpoint `checkpoint_claude_s03_u46_royal_oppression_20260914.zip` `b703c20d…`)

- **Classification:** ENGINE_MISSING (shared-use access) + INTEGRATION_MISSING (Special Summon effect declarations read by 神の警告).
- **Consumers:**
  - shared use: 《王宮の弾圧》 (1 card in the 4996 pool; accepted under the major-deck exception, since it is in 5 fixed lists: six, jurrac, bf, tg_skill, worm);
  - SS-effect link: 《神の警告》 and 《王宮の弾圧》.
- **Contract, shared use:**
  - A face-up card on the opponent's field that declares `sharedUseS03:true` is offered to the responding player: in chain responses (`sharedUseResponseCandidatesS03`) and in the summon-negation window (`sharedUseSummonNegatorsS03`).
  - Candidates carry `ownerS03`. `duelActivateResponseV2` / `pointActivateV27` / `activateSummonNegatorV2` accept the owner, and `prepareDuelActivation(opts.zoneOwnerS03)` reads the card from the owner's zone.
  - The user pays the cost and owns the chain link. `CHAIN_ADD.zoneOwnerS03` is written only when it differs from the user, so existing digests are unchanged.
- **Contract, SS-effect link:**
  - `specialSummonEffectLinkS03(link)` is true when the link is not a card activation only, and either the declaration table (`declareSpecialSummonEffectS03`) or the script's `includesSpecialSummon` says so (true, or a function of the link).
  - Declared in U46: 真六武衆－カゲキ, 六武衆の荒行, 諸刃の活人剣術, レスキューラビット, スクラップ・ドラゴン (② onDestroy only), 六武の門 (m6 only).
- **Other additions:**
  - `summonNegate` kinds for 王宮の弾圧: procedure / synchro / xyz (Synchro and Xyz Summons also wait in the summon-negation window via `beginExSummonV2`).
  - `onFieldEffectS03:true`: a face-up S/T effect is offered in responses without making the set activation card-only (unlike `fieldIgnition`).
  - `inDamageStepS03()`.
- **2011 source:** yugioh-wiki 《王宮の弾圧》 age 42 (2011-08-28).
- **Design choices with no ruling found:**
  - A set copy activated while an answerable Special Summon is pending uses the effect when the user can pay.
  - Summon negators are still offered only to the non-summoning player; the 09/03/15 own-summon use is not offered.
- **Remaining:**
  - Other scripts that Special Summon without the declaration (outside the six / rabbit lists) are not yet audited.
  - 神の宣告's summon path is unchanged.

### C-S03-37 addendum (S03-U47, dependent recovery — checkpoint `checkpoint_claude_s03_u47_special_summon_effect_decl_20260914.zip` `92d9aed6…`)

- **Declarations:** `cards/HA_claude_s03_u47_special_summon_effect_decl.js` declares the Special Summon effects of the scripted cards in Astra's 13 fixed lists.
  - Found by a read-only scan (61 cards with a Special Summon sentence, 42 unseen), then classified by text and loaded-script structure.
  - Per effect: スターダスト・ドラゴン `end-return`, アームズ・エイド `unequip-self`, カラクリ大将軍 無零怒 / カラクリ将軍 無零 `onSpecialSummon`, TG ワーウルフ not `onEndPhase`.
  - Whole card: 16 others (BF ×4, カラクリ忍者 九壱九, ジュラック・グアイバ, スケープ・ゴート, スポーア, ダンディライオン, デブリ・ドラゴン, ドッペル・ウォリアー, ハイドロゲドン, ローンファイア・ブロッサム, ワン・フォー・ワン, 暗黒界の尖兵 ベージ, 創造の代行者 ヴィーナス, 墓守の偵察者).
- **Contract change:** `specialSummonEffectLinkS03(link, opts)`. `opts.excludeSpellTrapEffect` rejects a Spell / Trap link that is not a card activation (`cardActivationS03`).
  - 《神の警告》 passes it (2011 yugioh-wiki age 35, 2011-08-03: FAQ 10/04/17, 11/01/05).
  - 《王宮の弾圧》 does not (age 42: it answers Spell / Trap effect activations).
- **Not declared:** 冥府の使者ゴーズ (its own Special Summon is chain-less), 暗黒界の術師 スノウ / 暗黒界の龍神 グラファ (no 2011 ruling found), and 12 unscripted fixed-list cards.
- **Rule for new scripts:** a card whose activated effect Special Summons declares `includesSpecialSummon` (true, or a function of the chain link), or gets a table entry.

## C-S03-38 EFFECT_DAMAGE_SOURCE_AND_BATTLE_DAMAGE_DRAIN (S03-U50, closed — checkpoint `checkpoint_claude_s03_u50_gorz_20260914.zip` `47bb8daa…`)

- **Classification:** INTEGRATION_MISSING (two engine contracts), found by the 冥府の使者ゴーズ real-duel illegal step (【HERO】 vs 兎ラギア).
- **Consumers:** 冥府の使者ゴーズ (hero, debris).
  - Every card that reacts to `onBattleDamage` / `onDirectBattleDamage` / `onLPChange` on the DUEL path (about 21 card files; none other in the fixed lists).
  - サディスティック・ポーション now receives a real `byPlayer`.
- **Contract, effect-damage source:**
  - While a chain link resolves, `RESOLVING_LINK_S03` holds `player`, `uid` and `chainLinkOne` (true when the chain is empty after `CHAIN_RESOLVE_TOP`).
  - `API.damageLP` stamps `byPlayer`, `sourceUid` and `chainLinkOneS03:true` (link 1 only) on the `LP` action.
  - `onLPChange` carries `chainLinkOneS03` only when true.
  - Fields are optional and appear only on new actions; old Replay packages keep their digests.
- **Contract, battle-damage drain:**
  - The Damage Step calculate stage enqueues `DRAIN_EVENTS` before the “after damage calculation” window.
  - So `onLPChange` (cause battle), `onBattleDamage` and `onDirectBattleDamage` are processed at the timing the damage was taken, rather than at an unrelated later flush.
- **2011 source:** yugioh-wiki 《冥府の使者ゴーズ》 age 37 (2011-05-28).
  - The battle-damage trigger is at the timing damage was taken, the same as 《魂を削る死霊》.
  - The effect-damage trigger works only from chain link 1.
- **Remaining:**
  - Effect damage dealt outside a chain link (e.g. rule damage, continuous effects) carries no source.
  - Triggers that need “damage from the opponent” refuse in that case.

## C-S03-39 ACTIVATION_TYPE_LOCK (S03-U51, closed — checkpoint `checkpoint_claude_s03_u51_shock_ruler_lock_20260914.zip` `0917247c…`)

- **Classification:** INTEGRATION_MISSING (the lock was recorded but never consulted), found by a real-duel stop in No.16 色の支配者ショック・ルーラー (【Jurrac】 vs 兎ラギア).
- **Consumer:** No.16 色の支配者ショック・ルーラー (hero, jurrac, rabbit, tg_gadget, worm).
- **Contract:**
  - `effectFlags.shockRuler = {kind:'m'|'s'|'t', turn, untilTurn}` on each player.
  - `activationTypeLockReasonS03(p, card, zone, db, opts)` returns a refusal reason while `gameState.turn <= untilTurn`.
  - Monster declared: any monster effect activation.
  - Spell / trap declared: card activations only (from the hand, a face-down set card, or `opts.cardActivation`); effect activations of face-up cards stay legal.
  - A flag without `untilTurn` (older saves) is ignored.
  - Consulted by `strictScriptLegalityV2` and the legacy `strictScriptLegality`, so response lists, trigger candidates, hand / zone actions and the activation itself agree.
- **2011 source:** yugioh-wiki 《Ｎｏ.１６ 色の支配者ショック・ルーラー》 age 8 (2011-08-31), FAQ 11/08/19.
  - Both players are locked until the end of the opponent's next turn.
  - Summons stay legal.
  - The lock persists after the monster leaves the field.
- **Also in U51:** the R1 driver skips Battle Phase / Main Phase 2 when `battlePhaseForbiddenV340` is true (measurement tool).
- **Remaining:** unscripted cards activated through manual / legacy paths are not checked against the lock.
