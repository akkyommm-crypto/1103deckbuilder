/* =========================================================================
   System v18 — LPChange / DamageReplacement primitive
   -------------------------------------------------------------------------
   「自分が受ける効果ダメージは0になる」「ダメージは半分になる」
   「回復する効果はダメージを与える効果になる」を共通化する。

   ■ 効果ダメージと戦闘ダメージを混同しない
     battle  … 戦闘ダメージ。既に v6 の continuous.battleDamage /
               battleDamageRedirect / piercingDamage が担当している。
               ここでは**置き換えない**。scope:'all' の規則だけが届く。
     effect  … カードの効果によるダメージ。今まで case "LP" が
               そのまま LP を動かしており、介入する層が無かった。
     cost    … コストとして払う LP。ダメージではないので規則の対象外。
     recover … 回復。ダメージへ変換する効果（シモッチ等）のためだけに見る。

   ■ 既に存在するので**作り直さない**もの:
     case "LP" / API.damageLP / recoverLP / payCost
     v6 の戦闘ダメージ層（continuous.battleDamage ほか）
     continuousSources / continuousReaches
     v7 scheduler（期限つき処理の予約）

   ■ 足りないので足すもの:
     1. LP が動く直前に通る中央の置換点。
     2. プレイヤー単位・期間つきの規則（0にする／半分にする／回復を
        ダメージに変える）。
     3. 永続効果ソースからの置換（continuous.lpChange）。
     4. 規則が何回働いたかの記録（「受けたダメージの回数だけ〜」用）。

   ■ Replay 安全性
     state は純JSON。規則は Action で積み、期限はターンの絶対値で持つ。
     判定は「今のターンと比べるだけ」の純関数。適用回数は規則の中に
     入れて数えるので、無制限の履歴にはならない。
   ========================================================================= */

const LP_CAUSE_V18 = Object.freeze(['effect','battle','cost','recover','all']);
const LP_MODE_V18 = Object.freeze(['prevent','half','double','convertRecover','redirect','damageToRecover']);   /* S03-U242: damageToRecover (レインボー・ライフ) */

function lpRulesV18(gs){
  gs = gs || gameState;
  return Array.isArray(gs.lpRulesV18) ? gs.lpRulesV18 : [];
}
function makeLpRuleV18(o, turn){
  const r = {
    player: (o.player === 0 || o.player === 1) ? o.player : null,
    cause: (LP_CAUSE_V18.indexOf(o.cause) >= 0) ? o.cause : 'effect',
    mode: (LP_MODE_V18.indexOf(o.mode) >= 0) ? o.mode : 'prevent',
    untilTurn: (o.untilTurn != null) ? Number(o.untilTurn) : Number(turn) || 0,
    label: String(o.label || '効果'),
    /* System v19 連携: 特定のチェーンリンクだけに効かせたい場合に使う。
       そのリンクがチェーンから消えたら規則も働かなくなる。 */
    chainId: (o.chainId != null) ? Number(o.chainId) : null,
    toPlayer: (o.toPlayer === 0 || o.toPlayer === 1) ? o.toPlayer : null,
    hits: 0,
  };
  /* S03-U271: 「相手が発動した…効果」 — only damage whose origin (the activating / attacking player) is this player.
     Added only when given, so rules of older journals keep their JSON shape. */
  if(o.originPlayerS03 === 0 || o.originPlayerS03 === 1) r.originPlayerS03 = o.originPlayerS03;
  return r;
}
function lpRuleActiveV18(rule, gs, info){
  if(!rule) return false;
  gs = gs || gameState;
  if(Number(rule.untilTurn) < Number(gs.turn)) return false;
  /* チェーンリンク指定の規則は、そのリンクがチェーンに残っている間だけ。 */
  if(rule.chainId != null){
    /* S03-U267: a link is removed from gs.chain before it resolves — match the damage's own link (LP action chainIdS03) */
    if(info && info.chainId != null && info.chainId === rule.chainId) return true;
    return Array.isArray(gs.chain) && gs.chain.some(l => l && l.chainId === rule.chainId);
  }
  return true;
}
/* その規則がこの LP 変化に働くか */
function lpRuleAppliesV18(rule, info){
  if(!rule || !info) return false;
  if(rule.player != null && rule.player !== info.player) return false;
  /* S03-U271: origin filter — the damage's byPlayer (resolving link's player for effect damage; the inflicting side for battle damage) */
  if(rule.originPlayerS03 === 0 || rule.originPlayerS03 === 1){ if(info.byPlayer !== rule.originPlayerS03) return false; }
  if(rule.cause === 'all') return info.cause !== 'cost';
  return rule.cause === info.cause;
}

/* ---- 中央の置換点 --------------------------------------------------------
   info = {player, delta, cause}。置換後の delta を返す。
   delta は負がダメージ、正が回復。                                        */
function resolveLpChangeV18(gs, info){
  gs = gs || gameState;
  if(!info || !Number.isFinite(Number(info.delta))) return info ? info.delta : 0;
  let delta = Number(info.delta);
  const cause = info.cause || 'unspecified';
  /* コストと未指定はルールの対象にしない（既存の挙動をそのまま守る）。 */
  if(cause === 'cost' || cause === 'unspecified') return delta;

  /* 1. 永続効果ソースによる置換（回復→ダメージ 等） */
  if(typeof continuousSources === 'function'){
    continuousSources().forEach(src=>{
      const f = src.sc.continuous && src.sc.continuous.lpChange;
      if(typeof f !== 'function') return;
      let r = null;
      try{ r = f({player:info.player, delta, cause, byPlayer:(info.byPlayer===0||info.byPlayer===1)?info.byPlayer:null}, src.card); }catch(e){ r = null; }   /* S03-U271: byPlayer */
      /* S03-U424: a source may also return {delta, redirectTo} — the damage is dealt to the other player instead (D・ライトン) */
      if(r && typeof r === 'object'){ if(r.redirectTo === 0 || r.redirectTo === 1) info.redirectTo = r.redirectTo; r = r.delta; }
      if(r != null && Number.isFinite(Number(r))) delta = Number(r);
    });
  }
  /* 2. プレイヤー単位の規則。ダメージ側だけを見る（回復は 1 で扱う）。 */
  const rules = lpRulesV18(gs);
  rules.forEach(rule=>{
    if(!lpRuleActiveV18(rule, gs, info)) return;
    if(!lpRuleAppliesV18(rule, {player:info.player, cause, byPlayer:(info.byPlayer===0||info.byPlayer===1)?info.byPlayer:null})) return;
    if(rule.mode === 'convertRecover'){
      if(delta > 0){ delta = -delta; rule.hits = (rule.hits||0) + 1; }
      return;
    }
    if(delta >= 0) return;                 // ダメージでなければ何もしない
    /* S03-U242: 「ダメージを受ける代わりに、その数値分だけライフポイントを回復する」 (レインボー・ライフ) */
    if(rule.mode === 'damageToRecover'){ delta = Math.abs(delta); rule.hits = (rule.hits||0) + 1; return; }
    if(rule.mode === 'redirect'){
      /* 受け手を差し替える。金額は変えない。 */
      if(rule.toPlayer === 0 || rule.toPlayer === 1){
        info.redirectTo = rule.toPlayer; rule.hits = (rule.hits||0) + 1;
      }
      return;
    }
    if(rule.mode === 'prevent'){ delta = 0; rule.hits = (rule.hits||0) + 1; }
    else if(rule.mode === 'half'){ delta = -Math.floor(Math.abs(delta)/2); rule.hits = (rule.hits||0) + 1; }
    else if(rule.mode === 'double'){ delta = -(Math.abs(delta) * 2); rule.hits = (rule.hits||0) + 1; }
  });
  return delta;
}

/* ---- 規則の登録と参照 ---------------------------------------------------- */
function addLpRuleV18(spec){
  act(Object.assign({type:'LP_RULE_V18', player:spec.player, cause:spec.cause, mode:spec.mode,
       turns:Number(spec.turns) || 0, label:spec.label || '効果',
       chainId:(spec.chainId != null) ? Number(spec.chainId) : null,
       toPlayer:(spec.toPlayer === 0 || spec.toPlayer === 1) ? spec.toPlayer : null},
       (spec.originPlayer === 0 || spec.originPlayer === 1) ? {originPlayerS03:spec.originPlayer} : {}));   /* S03-U271 */
  return true;
}
function clearLpRulesV18(label){
  act({type:'LP_RULE_V18', clear:true, label:label || null});
  return true;
}
/* その label の規則が何回働いたか */
function lpRuleHitsV18(gs, label){
  return lpRulesV18(gs).filter(r => r && r.label === label)
    .reduce((n, r) => n + (Number(r.hits) || 0), 0);
}
/* 期限切れの掃除（PASS_TURN から呼ぶ）。配列を小さく保つだけ。 */
function pruneLpRulesV18(gs){
  gs = gs || gameState;
  if(!Array.isArray(gs.lpRulesV18)) return;
  gs.lpRulesV18 = gs.lpRulesV18.filter(r => lpRuleActiveV18(r, gs));
}

/* ---- 直列化の検査（テスト用） ------------------------------------------- */
function assertLpStateSerializableV18(gs){
  gs = gs || gameState;
  const list = gs.lpRulesV18;
  if(list == null) return null;
  if(!Array.isArray(list)) return 'lpRulesV18 が配列でない';
  for(const r of list){
    if(!r || typeof r !== 'object') return 'lpRulesV18 の要素が object でない';
    for(const k of Object.keys(r)){
      const v = r[k];
      if(v != null && typeof v !== 'number' && typeof v !== 'string'){
        return 'lpRulesV18.' + k + ' が JSON 化できない';
      }
    }
  }
  try{ JSON.parse(JSON.stringify(list)); }
  catch(e){ return 'lpRulesV18 が JSON 化できない'; }
  return null;
}
