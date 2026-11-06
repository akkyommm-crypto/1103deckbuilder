/* S03-U523: 忘却の海底神殿（1103対象の未実装カード。carddata のテキスト）。

   忘却の海底神殿（永続罠）
     このカードがフィールド上に存在する限り、このカードのカード名は「海」として扱う。
     1ターンに1度、自分フィールド上のレベル4以下の魚族・海竜族・水族モンスター1体を選択してゲームから除外できる。
     自分のエンドフェイズ時、この効果で除外したモンスターを特殊召喚する。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-CAD8E3C2E5FD（09/11/14）《海竜－ダイダロス》などの「《海》をコストにする効果」のコストに使用できる。
     WIKI-C8A821DF0FA0（09/11/14）《王宮のお触れ》発動中は「『海』として扱う効果」が無効になりコストにできない。
     WIKI-ECF09EA16413（09/12/11）セットされた状態では《コダロス》のコストにできない。
       → 名前の扱いは継続効果（continuous.nameOverride, System v17）。表側表示でだけ働き、
         無効化されている間は働かない（continuousSources が無効の罠を外す。S03-U118）。
         参照する側は共通の探索 seaCardsOnFieldS03（engine/1ZZZB、S03-U523）で見る。
     WIKI-17D54319001D（09/11/14）除外する効果は**相手ターンにも発動でき、スペルスピードは2**。
       除外時と特殊召喚時の**両方でチェーンブロックを作る**。
     WIKI-C1C1FCE76FDE（09/11/14）除外する効果はダメージステップ中には発動できない
       → ダメージステップで発動できる宣言（damageStepLegal / damageStepOnly）をしない
         （engine/30 の damageStepResponseLegalV28 が既定で断る）。
     WIKI-9579091639BA（09/11/14）このカードがフィールドを離れていた場合は特殊召喚できない
       → 除外した uid はこのカードのゾーン限定の印に持つ（場を離れると消える。ZONE_LOCAL_KEYS）。
     WIKI-B0409A61B7FF（09/11/21）エンドフェイズに相手フィールドへ特殊召喚する事はできない。
     WIKI-2326439618A8（10/08/08）コントロールを得ていた相手モンスターを除外した場合も、自分フィールドに特殊召喚する
       → 特殊召喚先は常に自分フィールド。
     WIKI-F21786650DE6（10/08/05）相手ターンと自分ターンに 1 体ずつ除外した場合、エンドフェイズに**同時に**特殊召喚する
       → 1 回の解決で記録した全てを出す（表示形式は 1 枚ずつ選ぶが、召喚はまとめて行う。engine/1ZZK の
         specialSummonPositionsS03、S03-U271）。
     WIKI-D46C2788D09D（09/12/16）《伝説の都 アトランティス》と両方ある場合、《コダロス》はどちらか 1 枚だけ送ればよい
       → 共通の探索が候補を 2 枚返し、送る側が 1 枚選ぶ。

   未対応（この単位では直していない）
     WIKI-6CC4BF7CF2FB（10/08/01）《大寒波》にチェーンして除外した場合、エンドフェイズに特殊召喚されない。
     《大寒波》の封じ（S03-U229 の activationBanS03）は「カードの発動」だけを止める形になっており、
     表側の永続カードの「効果の発動」は止めない。この裁定を満たすには《大寒波》側の封じの範囲を直す必要がある。
     F45BBE1F8F90 / CC3E04BCABFA（10/10/22）の「特殊召喚後にコントロールを戻すか」は当時「調整中」。 */

function u523TempleTargetsS03(ctx){
  return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>{
    if(!x.card || x.card.face !== 'up') return false;
    const lv = (typeof curLV === 'function') ? Number(curLV(x.card)) : Number(x.db.lv || 0);
    if(!(lv <= 4)) return false;
    const ra = (typeof currentRaceV17 === 'function') ? currentRaceV17(x.card) : x.db.ra;
    return ra === '魚' || ra === '海竜' || ra === '水';
  }});
}
function u523TempleBanishedS03(card){
  const list = card && card.u523TempleUidsS03;
  return Array.isArray(list) ? list.slice() : [];
}
/* エンドフェイズの誘発: 自分のエンドフェイズに、記録した除外モンスターが除外のままある時だけ。 */
function u523TempleDueS03(ctx){
  if(ctx.zone !== 'sz' || !ctx.card || ctx.card.face !== 'up' || ctx.card.activationPending) return [];
  if(gameState.phase !== 'end' || ctx.player !== gameState.activePlayer) return [];
  return u523TempleBanishedS03(ctx.card).filter(u=>{
    const h = (u != null) ? findCardByUid(u) : null;
    return !!h && h.zone === 'banish';
  });
}

defineUnifiedCardV4('忘却の海底神殿', [{
  key:'banish', type:EFFECT_TYPE.QUICK, range:LOCATION.SZONE, speed:2, events:['activate'],
  targetRange:LOCATION.MZONE, targetSide:'self',
  condition(ctx){
    if(ctx.zone !== 'sz' || !ctx.card || ctx.card.face !== 'up' || ctx.card.activationPending){
      ctx.reason = '表側表示で存在する時に効果を発動します'; return false;
    }
    if(!u523TempleTargetsS03(ctx).length){
      ctx.reason = '自分フィールドにレベル4以下の魚族・海竜族・水族モンスターがいません'; return false;
    }
    return true;
  },
  target(ctx, done){
    API.selectCard('忘却の海底神殿：ゲームから除外するモンスター', u523TempleTargetsS03(ctx), t=>done([t]));
  },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const uid = ensureCardUid(gameState, r.card);
    API.banish(r, '忘却の海底神殿');
    const me = locateCardAnyV4(ctx.card);
    const now = (uid != null) ? findCardByUid(uid) : null;
    if(!me || me.zone !== 'sz' || !now || now.zone !== 'banish') return;
    /* WIKI-9579091639BA: 場を離れたら特殊召喚できない → 記録はこのカードのゾーン限定の印に持つ。 */
    const list = u523TempleBanishedS03(ctx.card).concat([uid]);
    API.setCardFlag(me, 'u523TempleUidsS03', list, '忘却の海底神殿（除外したモンスター）', {silent:true});
  },
  afterResolve(){}
}, {
  key:'return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u523TempleDueS03(ctx).length > 0; },
  operation(ctx){
    const uids = u523TempleDueS03(ctx);
    if(!uids.length) return;
    /* WIKI-F21786650DE6: まとめて特殊召喚する。WIKI-B0409A61B7FF / WIKI-2326439618A8: 出す先は常に自分フィールド。 */
    const items = uids.map(u=>({uid:u, from:'banish'}));
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'sz') API.setCardFlag(me, 'u523TempleUidsS03', [], '忘却の海底神殿（記録を消す）', {silent:true});
    if(typeof specialSummonPositionsS03 === 'function') specialSummonPositionsS03(ctx.player, items, '忘却の海底神殿');
  },
  afterResolve(){}
}], {type:'trap', priority:2, targets:true, quickEffect:true, forced:false,
  countLimit:{n:1, effects:['banish']},
  includesSpecialSummon:true,
  /* 「このカードのカード名は『海』として扱う」 */
  continuous:{ scope:'self', from:['sz'], apply(){ return null; },
    nameOverride(card, self){ return (card === self && self.face === 'up' && !self.activationPending) ? '海' : null; } },
  passive:{ onEndPhase(ctx){ return u523TempleDueS03(ctx).length > 0; } }});

/* カードの発動そのものに要求は無く、発動時の効果も無い（S03-U10 の分類と同じ扱い）。 */
declareCardActivationFreeV32(['忘却の海底神殿']);
