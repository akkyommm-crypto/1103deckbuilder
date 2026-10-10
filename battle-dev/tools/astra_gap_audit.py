"""Cycle66 inventory: reason + card text + reviewed producer/consumer matrix.

Counts are inventories, not a claim that one primitive completes every member.
Keep the original baseline inputs inside the report for historical reproducibility.
"""
import json, re
from pathlib import Path
from collections import Counter
ROOT = Path(__file__).resolve().parents[1]
def read(p): return json.loads((ROOT/p).read_text(encoding='utf8'))
# key, label, source evidence, actual support / remaining boundary,
# related NOT_STARTED text pattern, architecture risk, replay risk, cost, practical value, direct estimate
SPECS = [
('grave_equip','墓地→装備', 'engine/00_state_actions.js:FX_MONSTER_EQUIP_V46; engine/40_legal_script_engine.js:API.equipMonster; engine/1E_equip_v15.js', 'v46 accepts mz only; FX_EQUIP accepts sz only. Existing UID links/continuous scope reusable; face-down/control/removal cleanup must be measured.', r'墓地[\s\S]*装備',2,2,2,10,4),
('equip_lifecycle','装備の状態・離脱由来・付与', 'engine/1E_equip_v15.js; engine/00_state_actions.js:dropEquips,attackLimitV48', 'Equip references and equippedMonster scope exist. dropEquips loses host history; attackLimit reads only target script or turn grant.',r'装備',3,3,3,8,3),
('summon_restriction','条件付き召喚・素材制約', 'engine/40_legal_script_engine.js:v46GlobalSpecialSummonRestrictionReason; engine/20_effect_primitives_ex.js; engine/70_summon_procedures.js', 'restriction handles race/attribute and hardcoded global locks; boolean cannotSpecialSummon cannot express source-zone/effect exceptions. Material filters partly exist.',r'召喚できない|のみ特殊召喚|素材にできない|素材とする場合',5,4,5,9,10),
('activation_lock','プレイヤー発動制限・チェーン参加', 'engine/40_legal_script_engine.js; engine/30_processor_chain_battle.js:processResolveLinkV2', 'Legality/activation/response paths separate; central player/type/name locks absent. Trap negation is not general activation prohibition.',r'発動できない|発動する事ができない|発動することができない',5,4,5,9,10),
('effect_gate','効果適用耐性・継続無効', 'engine/1C_negation_v13.js; engine/1K_destruction_protection_v21.js; engine/00_state_actions.js:effectNegatedBy', 'Target immunity, link negation, destruction gate exist; effect immunity across bounce/banish/stat/control requires new application boundary.',r'効果を受けない|効果は無効|効果を無効',5,5,5,10,12),
('hidden_banish','裏側除外・非公開ゾーン状態', 'engine/00_state_actions.js:FX_BANISH,pushZone; engine/1J_reveal_v20.js', 'FX_BANISH normalizes face up; inspect/reveal does not provide hidden banish representation.',r'裏側[\s\S]*除外',5,5,4,3,3),
('simultaneous_hidden','同時非公開選択', 'engine/09_choice_request_v49.js:pendingChoice; engine/1J_reveal_v20.js', 'One pending choice/resume at a time; simultaneous commitments and public/private projection require separate design.',r'お互い[\s\S]*手札[\s\S]*選',5,5,5,3,3),
('gemini','デュアル・再度召喚', 'engine/70_summon_procedures.js; engine/00_state_actions.js:ZONE_LOCAL_KEYS', 'dualUp reset key exists but no complete second Normal Summon legality/producer/identity consumer.',r'もう1度召喚|再度召喚|デュアル',5,4,5,5,3),
('zone_model','固定ゾーン・S/Tへの別種表現', 'engine/00_state_actions.js:ZONE_LIMITS; engine/70_summon_procedures.js', 'Compact arrays cannot express columns or specific locked slots. v46 Equip does not represent Continuous Spell or dual-occupancy Trap Monster.',r'ゾーンは使用|永続魔法カード扱い|モンスターカード扱い|正面|隣の',5,5,5,5,7),
('forced_branch','誘発ブランチ別強制性', 'engine/40_legal_script_engine.js:beginEventWindowV2,collectEventCandidates; engine/45_unified_effect_v4.js', 'SEGOC paths coerce sc.forced at script scope; branching mixed mandatory/optional effects need retained branch metadata.',r'特殊召喚する。',3,3,2,3,2),
('attack_rules','攻撃対象・義務・コスト・履歴', 'engine/30_processor_chain_battle.js:battleTargetsV29; engine/00_state_actions.js:canDeclareAttackV48; engine/15_battle_v6.js', 'Attack count and permissions exist. No general target exclusion/cost transaction; battle-scoped duration and source-applied damage need finer provenance.',r'攻撃できない|攻撃しなければ|攻撃対象|全てのモンスターに1回|戦闘を行った',4,4,4,8,8),
('cost_interception','コスト置換・累積', 'engine/40_legal_script_engine.js:API.payCost; engine/1H_lp_change_v18.js', 'LP cause distinguishes cost; scripts pay directly. External exemptions/interception and accumulated costs are not centrally represented.',r'ライフポイント.*必要なく|LP.*払う必要|払ったライフ',4,4,3,3,2),
('phase_rules','フェイズ・維持コスト・勝利', 'engine/16_scheduler_v7.js; engine/00_state_actions.js:SET_PHASE', 'JSON scheduler exists; extra/skip phase, mandatory maintenance and automatic alternate wins are different transition rules.',r'スタンバイ|フェイズをスキップ|エンドフェイズ|勝利する',4,4,4,5,5),
('provenance','イベント由来・移動・召喚履歴', 'engine/12_provenance_v3.js; engine/1M_provenance_v30.js; engine/17_draw_event_v8.js; engine/07_zone_events_v42.js', 'P3 cost/material snapshots, v30 destroy log and v8 draw/add events exist. Producer coverage differs by action; zone-local reset can erase facts before later consumer.',r'墓地へ送られた|破壊された|リリースされた|手札に加わった|捨てられた',3,4,4,9,8),
('battle_events','戦闘時点・破壊・ダメージ', 'engine/15_battle_v6.js; engine/30_processor_chain_battle.js:processBattle; engine/00_state_actions.js:BATTLE', 'Battle v6 has attacker/defender/destroyed snapshots; many reasons predate it. Per-battle applied-source state remains incomplete.',r'戦闘|攻撃宣言|ダメージステップ',3,4,4,7,5),
('lp','LP・ダメージ置換', 'engine/1H_lp_change_v18.js; engine/00_state_actions.js:emitLpChangeV28', 'Player/cause/turn LP rules and applied LP event exist. One-chain-link or one-battle interception needs finer scope.',r'ダメージ|ライフポイント|LP',3,4,3,5,4),
('ritual','儀式素材・手順', 'engine/14_ritual_v5.js; engine/00_state_actions.js:FX_RITUAL_SUMMON', 'Ritual pipeline already exists, UID material refs, exact/atLeast and external registry. Deck materials/overrides must be checked per card.',r'儀式',3,3,3,5,2),
('summon','召喚手順・同時召喚', 'engine/70_summon_procedures.js; engine/30_processor_chain_battle.js:RESOLUTION_SUMMON_BATCH_V2; engine/00_state_actions.js:FX_SPECIAL_SUMMON', 'Legal resolution batch exists, owner routing and source provenance exist. Hand/deck procedures, simultaneous positions and extra Normal allowances need card-specific review.',r'特殊召喚|アドバンス召喚',4,4,4,8,5),
('hidden_choices','確認・宣言・乱数・順序', 'engine/09_choice_request_v49.js; engine/10_activation_choice_v11.js; engine/1J_reveal_v20.js; engine/06_replay_rng_v41.js', 'P1/P1.1, private inspect, atomic deck ordering and deterministic RNG exist. Name declaration, reroll interception and continued private projection remain separate gaps.',r'確認|宣言|コイントス|サイコロ|ランダム',4,5,4,5,5),
('choice','解決時選択・発動コスト/対象', 'engine/09_choice_request_v49.js; engine/10_activation_choice_v11.js; engine/45_unified_effect_v4.js', 'P1 resume tokens and P1.1 activation state already exist. Legacy callback shapes and atomic multi-operation needs must not be conflated with missing ChoiceRequest.',r'選択|対象|選んで',3,4,3,7,3),
('identity','名前・集合・対応表', 'engine/04_setcode_authority_v4.js; data/setcode_overlay_v4.json; engine/1G_characteristic_v17.js', 'Canonical setcode authority exists; coverage and per-zone aliases need review. Do not add name substring hacks.',r'名のついた|カード名|として扱う',2,2,3,5,2),
('stats','レベル・攻守・特性レイヤー', 'engine/1D_stat_modifier_v14.js; engine/1F_level_modifier_v16.js; engine/1G_characteristic_v17.js', 'Field modifiers, expiry, continuous set/add and current consumers exist. Hand-wide, dynamic original stats, effect copying differ.',r'攻撃力|守備力|レベル',3,3,3,5,2),
('destruction','破壊保護・置換', 'engine/1K_destruction_protection_v21.js; engine/00_state_actions.js:FX_TO_GRAVE,BATTLE_CLEANUP', 'v21 supports conditional protection and consumed counts. Replacement destination/choose substitute still requires routing analysis.',r'破壊されない|代わりに',3,3,3,7,2),
('control','コントロールと所有者', 'engine/00_state_actions.js:FX_CONTROL,emitControlChangeV26,cardOwnerIndex', 'Transfer event/owner routing exist; transfer immunity and continuous restoration absent.',r'コントロール',3,3,3,4,3),
('counter','カウンター資源', 'engine/1L_counter_v22.js; engine/00_state_actions.js:COUNTER_ADD', 'Typed counters/cost actions exist; exact producer events and recurring usage semantics differ.',r'カウンター',2,3,2,4,1),
('movement','移動・置換・原子的処理', 'engine/00_state_actions.js:FX_BANISH,FX_BOUNCE,FX_MILL_TOP; engine/18_leave_field_v9.js', 'Owner routing and leave links exist. Generic destination replacement, fully atomic bulk transactions and reset boundaries need review.',r'墓地|デッキ|除外',4,4,4,6,3),
('other','ルール修飾・複合要件', 'engine/00_state_actions.js; engine/40_legal_script_engine.js', 'Residual composite requirements; no estimated direct unlock without a focused probe.',r'手札|フィールド',5,5,5,1,0),
]
explicit = {
 'grave_equip':[526,576,577,580,594,595,615],
 'equip_lifecycle':[220,292,397,461,489,495,500,509,527,531,579],
 'summon_restriction':[41,47,81,130,151,196,197,270,274,317,336,401,470,475,492,513,520,528,541,551,553,559,566,573,578,588,589,590,591,592,597,605,609,610,611],
 'activation_lock':[43,51,58,63,138,162,233,269,326,557,558,562,568,575,583,600,614],
 'effect_gate':[10,17,23,29,39,68,77,79,88,140,150,156,158,161,169,179,183,221,246,251,260,265,319,328,334,337,373,408,416,449,452,479,554,555,571,572,593],
 'hidden_banish':[552,560,587], 'simultaneous_hidden':[9,62,104,224,248,362,473,499,584],
 'gemini':[253,287,544,602,616], 'zone_model':[42,102,105,157,165,194,201,210,245,318,350,357,404,438,603,604],
 'forced_branch':[619,620,563], 'cost_interception':[4,264,586],
 'attack_rules':[54,61,99,146,153,176,244,321,381,497,539,540,549,561,565,569,570,574,581,598,599,601,608],
 'phase_rules':[2,5,6,7,15,19,21,82,112,119,120,144,160,166,288,313,324,376,460,506,507,567,607,617],
 'control':[359,529,530,596], 'provenance':[523,532,533,534,535,536,537,538,545,548,556,564,582,618],
 'destruction':[1,521,522,524,547], 'lp':[3,30,55,256,315,347,485,525,606],
 'identity':[542,550], 'hidden_choices':[32,585,612,613], 'other':[546],
}
def classify(i,reason,d):
 for k,ids in explicit.items():
  if i in ids:return k
 s=reason.lower(); t=d.get('e','')
 for key,rx in [('effect_gate',r'immun|effect negation|negation of|効果を受けない'),('equip_lifecycle',r'equip'),('ritual',r'ritual'),('hidden_choices',r'private|hidden|reveal|declar|random|coin|die result|order'),('battle_events',r'battle|attack|piercing'),('lp',r'damage|lp |recovery'),('provenance',r'provenance|event|trigger'),('summon',r'summon|tribute|material'),('choice',r'choice|select|mode'),('identity',r'canonical|metadata|mapping|identity'),('stats',r'level|stat|atk|def'),('destruction',r'destr|replacement'),('movement',r'grave|banish|deck|zone'),('phase_rules',r'phase|schedule|turn'),('control',r'control|owner'),('counter',r'counter')]:
  if re.search(rx,s+' '+t):return key
 return 'other'
def main():
 cov=read('data/script_coverage.json'); db={d['n']:d for d in read('data/carddata.json')}
 overrides=read('data/script_status_overrides.json')['cards']
 gaps=[(n,r) for n,r in overrides.items() if r['status']=='ENGINE_GAP']; assert len(gaps)==620
 ns=[r for r in cov['cards'] if r['status']=='NOT_STARTED']
 rows=[]
 for i,(n,r) in enumerate(gaps,1):
  rows.append(dict(number=i,name=n,cluster=classify(i,r['reason'],db[n]),original_reason=r['reason'],card_text=db[n]['e'],registrations=next(x['registrations'] for x in cov['cards'] if x['name']==n)))
 counts=Counter(x['cluster'] for x in rows); summary=[]
 for k,label,evidence,support,rx,ar,rr,cost,pv,direct in SPECS:
  related=[r['name'] for r in ns if re.search(rx,db[r['name']].get('e',''))]
  # Secondary is a text-matched related inventory. Confidence discounts ambiguity;
  # cap expected secondary at 10 to avoid ranking broad patterns above concrete probes.
  confidence=.7 if k=='grave_equip' else .2
  expected=min(10,len(related)*confidence)
  direct=min(counts[k],direct)
  roi=round((direct+expected+pv)/(ar+rr+cost),2)
  summary.append(dict(key=k,label=label,direct_cards=counts[k],estimated_direct_unlock=direct,related_not_started=related,secondary_confidence=confidence,architecture_risk=ar,replay_risk=rr,cost=cost,practical_value=pv,roi=roi,evidence=evidence,support=support))
 payload=dict(baseline='Cycle66',counts=cov['counts'],method='Exhaustive primary inventory, text + original reasons + reviewed architecture matrix. Estimates are not verified completions. Explicit assignments are Cycle66 ordinal IDs.',clusters=summary,cards=rows)
 (ROOT/'data/astra_gap_audit_cycle66.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 lines=['# Astra System 01 — Cycle66 全620件の構造監査','', 'Baseline: 11269 PASS / 0 FAIL; TESTED 2042 / ENGINE_GAP 620 / NOT_STARTED 1310. SHA256 83a5ceba6a66c6f3cd7afb6946a4a45311018bc67d70aa5cd834faa3dea8e034.', '', '全件を主原因へ一意に割当。元の理由・DB全文・登録位置をJSONへ保存。各分類を現行producer/state/consumerと照合した。全620枚の実戦テストを完了したという意味ではない。複合要件は元の理由に保持。RelatedはNOT_STARTED本文の候補集合（重複あり）、Direct cardsは分類件数であり直接解禁数ではない。Estimated unlockは単独System後の保守的候補数。裁定と実戦Gate前にはTESTEDへ変更しない。', '', '| Cluster | Gap type | Direct cards | Related NOT_STARTED | Major deck relevance | Existing partial support | Risk (architecture/replay/cost) | Estimated unlock | ROI |','|---|---|---:|---:|---|---|---|---:|---:|']
 for c in summary:
  lines.append(f"| {c['key']} | {c['label']} | {c['direct_cards']} | {len(c['related_not_started'])} | practical {c['practical_value']}/10 | {c['support']} | {c['architecture_risk']}/{c['replay_risk']}/{c['cost']} | {c['estimated_direct_unlock']} | {c['roi']} |")
 lines+=['','ROI = (estimated direct + min(10, related × confidence) + practical value) / (architecture risk + replay risk + cost). Relative planning scores, not measured engineering hours. Grave-equip confidence .7; broad text matches .2.','', '## 選択とデッキへの影響','', 'System 01 = Grave-to-Equip / equip lifecycle extension。ドラグニティ、アンデット装備、機械ロイドを同じUIDリンクで扱える。大規模な効果適用gate・召喚制限より境界が狭く、Choice/Equip/Replay資産を再利用できる。装備ライフサイクルを同時に修復しなければ正確な解禁にはならない。', '', '直接対象7枚: ザ・キックマン、ガーディアン・エルマ、ギルフォード・ザ・レジェンド、ゲットライド!、トラックロイド、ドゥクス、ギルファー・デーモン。ただしエルマは召喚制約、ゲットライド!はユニオン適正/効果、ギルフォードは最大装備割当も必要。直接解禁見込みは残る4枚。', '', 'Secondary候補のうちヴァジュランダ、レギオン、ミスティル、チョップマンは優先検証。レヴァテインは墓地からの非チェーン召喚起点と破壊直前装備の由来が別途必要。アキュリスは装備解除と墓地移動の順序/任意when裁定が必要。ブランディストックはcontinuous attack-limit consumerを別途必要とするため装備配置のみの解禁には含めない。', '', '主要デッキ対応: summon/activation/effect gateはドラグニティ・六武衆・代行天使・HERO・BFに広く重要。Ritualはリチュア、GeminiはデュアルHERO、counterは六武衆/魔力、provenanceは暗黒界/魔轟神/植物、hiddenは汎用罠。ユーザー実デッキの40/15リストは添付に無いため、全ドラグニティ＋レダメ関連の監査を暫定KPIとし、ユーザーの実リストと称さない。', '', '## 古い理由への注意','', 'Ritual / Choice / LevelModifier / Counter / protection / draw provenanceは既に存在する。理由の語だけでSystemを増設しない。黒き森のウィッチ、D-HERO ディスクガイ、処刑人マキュラ等には後年エラッタ由来の理由が含まれ、1103では別途歴史監査が必要。grave continuousの「残り1枠」はコードの制限ではない。現状statusは証拠なしに変更しない。', '', '## 現行コードの照合先']
 for c in summary: lines+=['',f"- {c['label']}: `{c['evidence']}` — {c['support']}"]
 (ROOT/'docs/ASTRA_GAP_CLUSTER_CYCLE66.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
 print(json.dumps(dict(total=sum(counts.values()),clusters=dict(counts),roi=sorted([(c['key'],c['roi']) for c in summary],key=lambda x:-x[1])),ensure_ascii=False))
if __name__=='__main__': main()
