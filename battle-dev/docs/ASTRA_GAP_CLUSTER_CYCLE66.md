# Astra System 01 — Cycle66 全620件の構造監査

Baseline: 11269 PASS / 0 FAIL; TESTED 2042 / ENGINE_GAP 620 / NOT_STARTED 1310. SHA256 83a5ceba6a66c6f3cd7afb6946a4a45311018bc67d70aa5cd834faa3dea8e034.

全件を主原因へ一意に割当。元の理由・DB全文・登録位置をJSONへ保存。各分類を現行producer/state/consumerと照合した。全620枚の実戦テストを完了したという意味ではない。複合要件は元の理由に保持。RelatedはNOT_STARTED本文の候補集合（重複あり）、Direct cardsは分類件数であり直接解禁数ではない。Estimated unlockは単独System後の保守的候補数。裁定と実戦Gate前にはTESTEDへ変更しない。

| Cluster | Gap type | Direct cards | Related NOT_STARTED | Major deck relevance | Existing partial support | Risk (architecture/replay/cost) | Estimated unlock | ROI |
|---|---|---:|---:|---|---|---|---:|---:|
| grave_equip | 墓地→装備 | 7 | 48 | practical 10/10 | v46 accepts mz only; FX_EQUIP accepts sz only. Existing UID links/continuous scope reusable; face-down/control/removal cleanup must be measured. | 2/2/2 | 4 | 4.0 |
| equip_lifecycle | 装備の状態・離脱由来・付与 | 12 | 159 | practical 8/10 | Equip references and equippedMonster scope exist. dropEquips loses host history; attackLimit reads only target script or turn grant. | 3/3/3 | 3 | 2.33 |
| summon_restriction | 条件付き召喚・素材制約 | 35 | 220 | practical 9/10 | restriction handles race/attribute and hardcoded global locks; boolean cannotSpecialSummon cannot express source-zone/effect exceptions. Material filters partly exist. | 5/4/5 | 10 | 2.07 |
| activation_lock | プレイヤー発動制限・チェーン参加 | 17 | 74 | practical 9/10 | Legality/activation/response paths separate; central player/type/name locks absent. Trap negation is not general activation prohibition. | 5/4/5 | 10 | 2.07 |
| effect_gate | 効果適用耐性・継続無効 | 48 | 59 | practical 10/10 | Target immunity, link negation, destruction gate exist; effect immunity across bounce/banish/stat/control requires new application boundary. | 5/5/5 | 12 | 2.13 |
| hidden_banish | 裏側除外・非公開ゾーン状態 | 3 | 3 | practical 3/10 | FX_BANISH normalizes face up; inspect/reveal does not provide hidden banish representation. | 5/5/4 | 3 | 0.47 |
| simultaneous_hidden | 同時非公開選択 | 9 | 1 | practical 3/10 | One pending choice/resume at a time; simultaneous commitments and public/private projection require separate design. | 5/5/5 | 3 | 0.41 |
| gemini | デュアル・再度召喚 | 5 | 32 | practical 5/10 | dualUp reset key exists but no complete second Normal Summon legality/producer/identity consumer. | 5/4/5 | 3 | 1.03 |
| zone_model | 固定ゾーン・S/Tへの別種表現 | 16 | 16 | practical 5/10 | Compact arrays cannot express columns or specific locked slots. v46 Equip does not represent Continuous Spell or dual-occupancy Trap Monster. | 5/5/5 | 7 | 1.01 |
| forced_branch | 誘発ブランチ別強制性 | 3 | 204 | practical 3/10 | SEGOC paths coerce sc.forced at script scope; branching mixed mandatory/optional effects need retained branch metadata. | 3/3/2 | 2 | 1.88 |
| attack_rules | 攻撃対象・義務・コスト・履歴 | 23 | 150 | practical 8/10 | Attack count and permissions exist. No general target exclusion/cost transaction; battle-scoped duration and source-applied damage need finer provenance. | 4/4/4 | 8 | 2.17 |
| cost_interception | コスト置換・累積 | 3 | 0 | practical 3/10 | LP cause distinguishes cost; scripts pay directly. External exemptions/interception and accumulated costs are not centrally represented. | 4/4/3 | 2 | 0.45 |
| phase_rules | フェイズ・維持コスト・勝利 | 26 | 283 | practical 5/10 | JSON scheduler exists; extra/skip phase, mandatory maintenance and automatic alternate wins are different transition rules. | 4/4/4 | 5 | 1.67 |
| provenance | イベント由来・移動・召喚履歴 | 97 | 180 | practical 9/10 | P3 cost/material snapshots, v30 destroy log and v8 draw/add events exist. Producer coverage differs by action; zone-local reset can erase facts before later consumer. | 3/4/4 | 8 | 2.45 |
| battle_events | 戦闘時点・破壊・ダメージ | 61 | 411 | practical 7/10 | Battle v6 has attacker/defender/destroyed snapshots; many reasons predate it. Per-battle applied-source state remains incomplete. | 3/4/4 | 5 | 2.0 |
| lp | LP・ダメージ置換 | 38 | 392 | practical 5/10 | Player/cause/turn LP rules and applied LP event exist. One-chain-link or one-battle interception needs finer scope. | 3/4/3 | 4 | 1.9 |
| ritual | 儀式素材・手順 | 12 | 17 | practical 5/10 | Ritual pipeline already exists, UID material refs, exact/atLeast and external registry. Deck materials/overrides must be checked per card. | 3/3/3 | 2 | 1.16 |
| summon | 召喚手順・同時召喚 | 39 | 598 | practical 8/10 | Legal resolution batch exists, owner routing and source provenance exist. Hand/deck procedures, simultaneous positions and extra Normal allowances need card-specific review. | 4/4/4 | 5 | 1.92 |
| hidden_choices | 確認・宣言・乱数・順序 | 97 | 139 | practical 5/10 | P1/P1.1, private inspect, atomic deck ordering and deterministic RNG exist. Name declaration, reroll interception and continued private projection remain separate gaps. | 4/5/4 | 5 | 1.54 |
| choice | 解決時選択・発動コスト/対象 | 32 | 505 | practical 7/10 | P1 resume tokens and P1.1 activation state already exist. Legacy callback shapes and atomic multi-operation needs must not be conflated with missing ChoiceRequest. | 3/4/3 | 3 | 2.0 |
| identity | 名前・集合・対応表 | 11 | 376 | practical 5/10 | Canonical setcode authority exists; coverage and per-zone aliases need review. Do not add name substring hacks. | 2/2/3 | 2 | 2.43 |
| stats | レベル・攻守・特性レイヤー | 7 | 474 | practical 5/10 | Field modifiers, expiry, continuous set/add and current consumers exist. Hand-wide, dynamic original stats, effect copying differ. | 3/3/3 | 2 | 1.89 |
| destruction | 破壊保護・置換 | 10 | 155 | practical 7/10 | v21 supports conditional protection and consumed counts. Replacement destination/choose substitute still requires routing analysis. | 3/3/3 | 2 | 2.11 |
| control | コントロールと所有者 | 6 | 50 | practical 4/10 | Transfer event/owner routing exist; transfer immunity and continuous restoration absent. | 3/3/3 | 3 | 1.89 |
| counter | カウンター資源 | 0 | 74 | practical 4/10 | Typed counters/cost actions exist; exact producer events and recurring usage semantics differ. | 2/3/2 | 0 | 2.0 |
| movement | 移動・置換・原子的処理 | 2 | 723 | practical 6/10 | Owner routing and leave links exist. Generic destination replacement, fully atomic bulk transactions and reset boundaries need review. | 4/4/4 | 2 | 1.5 |
| other | ルール修飾・複合要件 | 1 | 1056 | practical 1/10 | Residual composite requirements; no estimated direct unlock without a focused probe. | 5/5/5 | 0 | 0.73 |

ROI = (estimated direct + min(10, related × confidence) + practical value) / (architecture risk + replay risk + cost). Relative planning scores, not measured engineering hours. Grave-equip confidence .7; broad text matches .2.

## 選択とデッキへの影響

System 01 = Grave-to-Equip / equip lifecycle extension。ドラグニティ、アンデット装備、機械ロイドを同じUIDリンクで扱える。大規模な効果適用gate・召喚制限より境界が狭く、Choice/Equip/Replay資産を再利用できる。装備ライフサイクルを同時に修復しなければ正確な解禁にはならない。

直接対象7枚: ザ・キックマン、ガーディアン・エルマ、ギルフォード・ザ・レジェンド、ゲットライド!、トラックロイド、ドゥクス、ギルファー・デーモン。ただしエルマは召喚制約、ゲットライド!はユニオン適正/効果、ギルフォードは最大装備割当も必要。直接解禁見込みは残る4枚。

Secondary候補のうちヴァジュランダ、レギオン、ミスティル、チョップマンは優先検証。レヴァテインは墓地からの非チェーン召喚起点と破壊直前装備の由来が別途必要。アキュリスは装備解除と墓地移動の順序/任意when裁定が必要。ブランディストックはcontinuous attack-limit consumerを別途必要とするため装備配置のみの解禁には含めない。

主要デッキ対応: summon/activation/effect gateはドラグニティ・六武衆・代行天使・HERO・BFに広く重要。Ritualはリチュア、GeminiはデュアルHERO、counterは六武衆/魔力、provenanceは暗黒界/魔轟神/植物、hiddenは汎用罠。ユーザー実デッキの40/15リストは添付に無いため、全ドラグニティ＋レダメ関連の監査を暫定KPIとし、ユーザーの実リストと称さない。

## 古い理由への注意

Ritual / Choice / LevelModifier / Counter / protection / draw provenanceは既に存在する。理由の語だけでSystemを増設しない。黒き森のウィッチ、D-HERO ディスクガイ、処刑人マキュラ等には後年エラッタ由来の理由が含まれ、1103では別途歴史監査が必要。grave continuousの「残り1枠」はコードの制限ではない。現状statusは証拠なしに変更しない。

## 現行コードの照合先

- 墓地→装備: `engine/00_state_actions.js:FX_MONSTER_EQUIP_V46; engine/40_legal_script_engine.js:API.equipMonster; engine/1E_equip_v15.js` — v46 accepts mz only; FX_EQUIP accepts sz only. Existing UID links/continuous scope reusable; face-down/control/removal cleanup must be measured.

- 装備の状態・離脱由来・付与: `engine/1E_equip_v15.js; engine/00_state_actions.js:dropEquips,attackLimitV48` — Equip references and equippedMonster scope exist. dropEquips loses host history; attackLimit reads only target script or turn grant.

- 条件付き召喚・素材制約: `engine/40_legal_script_engine.js:v46GlobalSpecialSummonRestrictionReason; engine/20_effect_primitives_ex.js; engine/70_summon_procedures.js` — restriction handles race/attribute and hardcoded global locks; boolean cannotSpecialSummon cannot express source-zone/effect exceptions. Material filters partly exist.

- プレイヤー発動制限・チェーン参加: `engine/40_legal_script_engine.js; engine/30_processor_chain_battle.js:processResolveLinkV2` — Legality/activation/response paths separate; central player/type/name locks absent. Trap negation is not general activation prohibition.

- 効果適用耐性・継続無効: `engine/1C_negation_v13.js; engine/1K_destruction_protection_v21.js; engine/00_state_actions.js:effectNegatedBy` — Target immunity, link negation, destruction gate exist; effect immunity across bounce/banish/stat/control requires new application boundary.

- 裏側除外・非公開ゾーン状態: `engine/00_state_actions.js:FX_BANISH,pushZone; engine/1J_reveal_v20.js` — FX_BANISH normalizes face up; inspect/reveal does not provide hidden banish representation.

- 同時非公開選択: `engine/09_choice_request_v49.js:pendingChoice; engine/1J_reveal_v20.js` — One pending choice/resume at a time; simultaneous commitments and public/private projection require separate design.

- デュアル・再度召喚: `engine/70_summon_procedures.js; engine/00_state_actions.js:ZONE_LOCAL_KEYS` — dualUp reset key exists but no complete second Normal Summon legality/producer/identity consumer.

- 固定ゾーン・S/Tへの別種表現: `engine/00_state_actions.js:ZONE_LIMITS; engine/70_summon_procedures.js` — Compact arrays cannot express columns or specific locked slots. v46 Equip does not represent Continuous Spell or dual-occupancy Trap Monster.

- 誘発ブランチ別強制性: `engine/40_legal_script_engine.js:beginEventWindowV2,collectEventCandidates; engine/45_unified_effect_v4.js` — SEGOC paths coerce sc.forced at script scope; branching mixed mandatory/optional effects need retained branch metadata.

- 攻撃対象・義務・コスト・履歴: `engine/30_processor_chain_battle.js:battleTargetsV29; engine/00_state_actions.js:canDeclareAttackV48; engine/15_battle_v6.js` — Attack count and permissions exist. No general target exclusion/cost transaction; battle-scoped duration and source-applied damage need finer provenance.

- コスト置換・累積: `engine/40_legal_script_engine.js:API.payCost; engine/1H_lp_change_v18.js` — LP cause distinguishes cost; scripts pay directly. External exemptions/interception and accumulated costs are not centrally represented.

- フェイズ・維持コスト・勝利: `engine/16_scheduler_v7.js; engine/00_state_actions.js:SET_PHASE` — JSON scheduler exists; extra/skip phase, mandatory maintenance and automatic alternate wins are different transition rules.

- イベント由来・移動・召喚履歴: `engine/12_provenance_v3.js; engine/1M_provenance_v30.js; engine/17_draw_event_v8.js; engine/07_zone_events_v42.js` — P3 cost/material snapshots, v30 destroy log and v8 draw/add events exist. Producer coverage differs by action; zone-local reset can erase facts before later consumer.

- 戦闘時点・破壊・ダメージ: `engine/15_battle_v6.js; engine/30_processor_chain_battle.js:processBattle; engine/00_state_actions.js:BATTLE` — Battle v6 has attacker/defender/destroyed snapshots; many reasons predate it. Per-battle applied-source state remains incomplete.

- LP・ダメージ置換: `engine/1H_lp_change_v18.js; engine/00_state_actions.js:emitLpChangeV28` — Player/cause/turn LP rules and applied LP event exist. One-chain-link or one-battle interception needs finer scope.

- 儀式素材・手順: `engine/14_ritual_v5.js; engine/00_state_actions.js:FX_RITUAL_SUMMON` — Ritual pipeline already exists, UID material refs, exact/atLeast and external registry. Deck materials/overrides must be checked per card.

- 召喚手順・同時召喚: `engine/70_summon_procedures.js; engine/30_processor_chain_battle.js:RESOLUTION_SUMMON_BATCH_V2; engine/00_state_actions.js:FX_SPECIAL_SUMMON` — Legal resolution batch exists, owner routing and source provenance exist. Hand/deck procedures, simultaneous positions and extra Normal allowances need card-specific review.

- 確認・宣言・乱数・順序: `engine/09_choice_request_v49.js; engine/10_activation_choice_v11.js; engine/1J_reveal_v20.js; engine/06_replay_rng_v41.js` — P1/P1.1, private inspect, atomic deck ordering and deterministic RNG exist. Name declaration, reroll interception and continued private projection remain separate gaps.

- 解決時選択・発動コスト/対象: `engine/09_choice_request_v49.js; engine/10_activation_choice_v11.js; engine/45_unified_effect_v4.js` — P1 resume tokens and P1.1 activation state already exist. Legacy callback shapes and atomic multi-operation needs must not be conflated with missing ChoiceRequest.

- 名前・集合・対応表: `engine/04_setcode_authority_v4.js; data/setcode_overlay_v4.json; engine/1G_characteristic_v17.js` — Canonical setcode authority exists; coverage and per-zone aliases need review. Do not add name substring hacks.

- レベル・攻守・特性レイヤー: `engine/1D_stat_modifier_v14.js; engine/1F_level_modifier_v16.js; engine/1G_characteristic_v17.js` — Field modifiers, expiry, continuous set/add and current consumers exist. Hand-wide, dynamic original stats, effect copying differ.

- 破壊保護・置換: `engine/1K_destruction_protection_v21.js; engine/00_state_actions.js:FX_TO_GRAVE,BATTLE_CLEANUP` — v21 supports conditional protection and consumed counts. Replacement destination/choose substitute still requires routing analysis.

- コントロールと所有者: `engine/00_state_actions.js:FX_CONTROL,emitControlChangeV26,cardOwnerIndex` — Transfer event/owner routing exist; transfer immunity and continuous restoration absent.

- カウンター資源: `engine/1L_counter_v22.js; engine/00_state_actions.js:COUNTER_ADD` — Typed counters/cost actions exist; exact producer events and recurring usage semantics differ.

- 移動・置換・原子的処理: `engine/00_state_actions.js:FX_BANISH,FX_BOUNCE,FX_MILL_TOP; engine/18_leave_field_v9.js` — Owner routing and leave links exist. Generic destination replacement, fully atomic bulk transactions and reset boundaries need review.

- ルール修飾・複合要件: `engine/00_state_actions.js; engine/40_legal_script_engine.js` — Residual composite requirements; no estimated direct unlock without a focused probe.
