/* =========================================================================
   S03-U34 — C-S03-27 ACTIVATION_NEGATED_RELEASE 「1ターンに1枚しか発動できず、発動するターン特殊召喚できない」
   -------------------------------------------------------------------------
   2011 wiki（《強欲で謙虚な壺》2011/08/25 版）：
     10/04/17 … めくるのは解決時。選んだカードも含めて相手に公開し、戻した後はシャッフルする。
     10/05/18 … 発動にチェーンして《緊急テレポート》などで特殊召喚することはできない。
     10/05/19 … 《神の宣告》などで発動を無効にされた場合、そのターンは特殊召喚でき、もう1枚のこのカードも発動できる。
   ■ 宣言したカードだけ
     count:true                       … 発動が無効になったら、CHAIN_ADD で消費した回数制限を COUNT_REFUND_S03（Action）で戻す。
     noSpecialSummonWhileChained:true … 自分の発動がチェーン上にあり、発動が無効になっていない間は特殊召喚できない
                                        （解決時にはカード側が noSpecialSummon を立てる）。
     新しい gameState キーもチェーンリンクの項目も作らない（回数の payload は countConsumePayloadV44 で作り直す）。
   ========================================================================= */
const ACTIVATION_NEGATED_RELEASE_S03 = {};
function declareActivationNegatedReleaseS03(name, spec){ ACTIVATION_NEGATED_RELEASE_S03[name] = spec || {}; }
function activationNegatedReleaseSpecS03(name){ return ACTIVATION_NEGATED_RELEASE_S03[name] || null; }

function activationNegatedReleaseS03(link){
  const spec = link && activationNegatedReleaseSpecS03(link.name);
  if(!spec || !spec.count) return;
  const sc = CARD_SCRIPTS[link.name];
  if(!sc || !sc.countLimit || typeof countConsumePayloadV44 !== 'function') return;
  const h = link.uid != null ? findCardByUid(link.uid) : null;
  const key = (typeof countLimitEffectKeyV32 === 'function') ? countLimitEffectKeyV32(link.name, sc, {v4EffectKey:link.v4EffectKey||null}) : null;
  const refund = countConsumePayloadV44(link.player, link.name, sc, h ? h.card : null, key);
  if(refund) act({type:'COUNT_REFUND_S03', player:link.player, name:link.name, refund});
}

function chainedActivationNoSpecialSummonS03(p){
  for(const l of (gameState.chain || [])){
    if(!l || l.player !== p) continue;
    if(l.activationNegated === true || (l.negated && l.negateMode === 'activation')) continue;
    const spec = activationNegatedReleaseSpecS03(l.name);
    if(spec && spec.noSpecialSummonWhileChained) return `「${l.name}」を発動したターンは特殊召喚できません`;
  }
  return '';
}
