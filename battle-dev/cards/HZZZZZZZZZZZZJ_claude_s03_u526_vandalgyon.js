/* S03-U526: 冥王竜ヴァンダルギオン（1103対象の未実装カード。carddata のテキスト）。

   冥王竜ヴァンダルギオン（効果・星8・ドラゴン・闇・攻2800/守2500）
     相手がコントロールするカードの発動をカウンター罠で無効にした場合、このカードを手札から特殊召喚する事ができる。
     この方法で特殊召喚に成功した時、無効にしたカードの種類により以下の効果を発動する。
     ●魔法:相手ライフに1500ポイントダメージを与える。
     ●罠:相手フィールド上のカード1枚を選択して破壊する。
     ●効果モンスター:自分の墓地からモンスター1体を選択して自分フィールド上に特殊召喚する。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-9220FED3DC74 発動タイミングは「カウンター罠の含まれる一連のチェーン処理が終了した後」。
       したがって**いかなる場合でもタイミングを逃さない**。
     WIKI-ECEE2A503FDB（09/05/15）カウンター罠がチェーン2で発動した場合もタイミングを逃さない
       → チェーンが空になった後に 1 回だけ積む窓（engine/1ZZZC の onCounterNegateS03）で見る。
     WIKI-EF5C7C459933（05/03/04）特殊召喚する効果は**任意効果**。
     WIKI-066CCCFCEEDF（05/03/14）/ WIKI-0838EAF7312A（05/03/04）どちらの効果もチェーンに乗る
       → 手札の誘発効果（1 つのチェーンブロック）＋特殊召喚成功時の誘発効果。
     WIKI-AB7CE119106E（06/08/01）特殊召喚する効果に《天罰》をチェーンできる
       → 効果モンスターの効果としてチェーンに乗る（既存の仕組みのまま）。
     WIKI-DEB7C9EE867E（05/03/04）相手ターンでも発動できる → 窓をターンで制限しない。
     WIKI-6C057DCC8B74（05/03/14）成功時の効果は対象が存在しなくても**発動して不発**になる
       → 強制の誘発効果にして、対象が無ければ何も行わない（発動自体は行う）。
     WIKI-19F58D392DF1（05/03/04）《神の宣告》で召喚・反転召喚・特殊召喚を無効にした場合は特殊召喚できない
       → 「カードの発動」の無効だけを数える（engine/1ZZZC は CHAIN_NEGATE_LINK だけを記録する）。
     WIKI-D06A75D8766F（07/01/04）手札に 2 枚あっても特殊召喚できるのは 1 枚だけ /
     WIKI-EEACBF2AFE00（07/01/04）《裁きを下す者－ボルテニス》と 1 枚ずつでもどちらか 1 枚だけ
       → 1 回の出来事（窓のイベントの処理番号）を player ごとに 1 回だけ使える。
     WIKI-6215605D7356（08/01/08）お互いの手札にある場合は双方が発動できる → 印は player ごと。
     WIKI-822781A9E595（09/01/03）《執念の剣》を《マジック・ジャマー》で無効にした場合もこの方法で特殊召喚する
       → 種類は「無効にされたカードの種別」で見る（装備魔法なら●魔法）。
     WIKI-A07AFFA1C527 / WIKI-BF2D2AB1783D（11/06/04）《虚無を呼ぶ呪文》で複数種類を同時に無効にした場合、
       種類ごとの効果をそれぞれ任意の順番でチェーンを組んで発動する
       → 種類ごとに別の効果（別のチェーンブロック）として持つ。

   「無効にした種類」は窓のイベントが運ぶので、このカードは記録を持たない。
   特殊召喚に成功した後、その種類だけをゾーン限定の印（u526KindsS03）に置く（場を離れると消える）。 */

/* 窓のイベントから「自分のカウンター罠で、相手がコントロールするカードの発動を無効にした種類」 */
function u526KindsFromEventS03(ctx){
  if(ctx.zone !== 'hand') return [];
  return (typeof counterNegateKindsForS03 === 'function') ? counterNegateKindsForS03(ctx.event, ctx.player) : [];
}
/* 1 回の出来事の番号（遅延イベントの処理番号。Replay でも同じ値） */
function u526StampS03(ctx){
  const e = ctx.event || {};
  return (e.stepS03 != null) ? Number(e.stepS03) : null;
}
function u526UsedS03(player, stamp){
  const P = gameState.players[player], f = (P && P.temporaryFlags) || {};
  return stamp != null && Number(f.u526UsedS03) === Number(stamp);
}
/* この方法で特殊召喚されたか（自身の効果で出た＝印がある） */
function u526SummonedByOwnEffectS03(ctx){
  const e = ctx.event || {};
  const self = e.card === ctx.card || (Array.isArray(e.cards) && e.cards.indexOf(ctx.card) >= 0)
               || (e.uid != null && ctx.card && e.uid === ctx.card.uid);
  if(!self || ctx.zone !== 'mz' || !ctx.card) return null;
  const kinds = ctx.card.u526KindsS03;
  return Array.isArray(kinds) && kinds.length ? kinds : null;
}
function u526HasKindS03(ctx, kind){
  const kinds = u526SummonedByOwnEffectS03(ctx);
  return !!kinds && kinds.indexOf(kind) >= 0;
}
/* 相手フィールド上のカード（モンスター・魔法＆罠・フィールド。裏側も含む） */
function u526FoeFieldCardsS03(ctx){
  const p = ctx.opponent, P = gameState.players[p], out = [];
  (P.mz || []).forEach((c, i)=>{ if(c) out.push({p:p, zone:'mz', index:i, card:c, db:dbOf(c)}); });
  (P.sz || []).forEach((c, i)=>{ if(c) out.push({p:p, zone:'sz', index:i, card:c, db:dbOf(c)}); });
  if(P.field) out.push({p:p, zone:'field', index:0, card:P.field, db:dbOf(P.field)});
  return out;
}
function u526GraveMonstersS03(ctx){
  return API.pileCards(ctx.player, 'grave',
    x=>x.db.k === 'm' && canEffectSpecialSummonS03(x.card, 'grave', '冥王竜ヴァンダルギオン'));
}
/* 表示形式の指定が無いので、特殊召喚は表側攻撃／守備のどちらかを選ぶ（engine/1ZZK） */
registerSsPositionAfterS03('s03u526.summon-after', (p, uids)=>{
  const uid = uids[0], now = (uid != null) ? findCardByUid(uid) : null;
  if(!now || now.zone !== 'mz' || now.p !== p) return;
  const kinds = (gameState.players[p].temporaryFlags || {}).u526KindsPendingS03;
  if(Array.isArray(kinds) && kinds.length)
    API.setCardFlag(now, 'u526KindsS03', kinds.slice(), '冥王竜ヴァンダルギオン', {silent:true});
});

defineUnifiedCardV4('冥王竜ヴァンダルギオン', [{
  /* 相手がコントロールするカードの発動をカウンター罠で無効にした場合、手札から特殊召喚する（任意） */
  key:'hand-special', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onCounterNegateS03'],
  condition(ctx){
    const kinds = u526KindsFromEventS03(ctx);
    if(!kinds.length){ ctx.reason = '自分のカウンター罠で相手のカードの発動を無効にしていません'; return false; }
    if(u526UsedS03(ctx.player, u526StampS03(ctx))){ ctx.reason = 'この無効化では既に特殊召喚しています'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'hand' || h.p !== ctx.player) return;
    const kinds = u526KindsFromEventS03(ctx), stamp = u526StampS03(ctx);
    /* WIKI-D06A75D8766F / WIKI-EEACBF2AFE00: 同じ無効化で 2 枚目は出せない（先に出た 1 枚で使い切る） */
    if(!kinds.length || u526UsedS03(ctx.player, stamp) || !hasMonsterZoneSpace(ctx.player)) return;
    API.setFlag(ctx.player, 'u526UsedS03', stamp, true);
    API.setFlag(ctx.player, 'u526KindsPendingS03', kinds.slice(), true);
    specialSummonPositionsS03(ctx.player, [{uid:ctx.card.uid, from:'hand'}],
                              '冥王竜ヴァンダルギオン', 's03u526.summon-after');
  },
  afterResolve(){}
}, {
  /* ●魔法: 相手ライフに1500ポイントダメージを与える */
  key:'kind-spell', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u526HasKindS03(ctx, 's'); },
  operation(ctx){ API.damageLP(ctx.opponent, 1500, '冥王竜ヴァンダルギオン'); },
  afterResolve(){}
}, {
  /* ●罠: 相手フィールド上のカード1枚を選択して破壊する */
  key:'kind-trap', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  targetRange:LOCATION.ONFIELD, targetSide:'opponent',
  condition(ctx){ return u526HasKindS03(ctx, 't'); },
  /* WIKI-6C057DCC8B74: 対象が無くても発動して不発になる（選択が開かず何も行わない） */
  target(ctx, done){
    const cands = u526FoeFieldCardsS03(ctx);
    if(!cands.length){ done([]); return; }
    API.selectCard('冥王竜ヴァンダルギオン：破壊する相手のカード', cands, t=>done([t]));
  },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && (r.zone === 'mz' || r.zone === 'sz' || r.zone === 'field')) API.destroy(r, '冥王竜ヴァンダルギオン');
  },
  afterResolve(){}
}, {
  /* ●効果モンスター: 自分の墓地からモンスター1体を選択して自分フィールド上に特殊召喚する */
  key:'kind-monster', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ return u526HasKindS03(ctx, 'm'); },
  target(ctx, done){
    const cands = u526GraveMonstersS03(ctx);
    if(!cands.length){ done([]); return; }
    API.selectCard('冥王竜ヴァンダルギオン：特殊召喚するモンスター', cands, t=>done([t]));
  },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || r.p !== ctx.player) return;
    if(!hasMonsterZoneSpace(ctx.player)) return;
    specialSummonPositionsS03(ctx.player, [{uid:r.card.uid, from:'grave'}], '冥王竜ヴァンダルギオン');
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, targets:true, timing:['free'],
  activateFrom:['hand'], includesSpecialSummon:true,
  blocksIfNoSpecialSummon(ctx){ return !!ctx && ctx.zone === 'hand'; },
  passive:{
    onCounterNegateS03(ctx){
      return u526KindsFromEventS03(ctx).length > 0 && !u526UsedS03(ctx.player, u526StampS03(ctx));
    },
    onSpecialSummon(ctx){ return !!u526SummonedByOwnEffectS03(ctx); }
  }
});
