/* =========================================================================
   S03-U178 — contact fusion (engine/1ZW) with the whole texts.
   VWXYZ－ドラゴン・カタパルトキャノン: 「VW－タイガー・カタパルト」＋「XYZ－ドラゴン・キャノン」 / 除外した場合のみ… /
     ①:1ターンに1度、相手フィールドのカード1枚を対象として発動できる。その相手のカードを除外する。
     ②:このカードが相手モンスターに攻撃宣言した時、その攻撃対象モンスター1体を対象として発動できる。その攻撃対象モンスターの表示形式を変更
       する。この時、リバースモンスターの効果は発動しない。
   混沌幻魔アーミタイル: 「神炎皇ウリア」＋「降雷皇ハモン」＋「幻魔皇ラビエル」 / 除外した場合のみ… / ①:このカードの攻撃力は自分ターンの間10000
     アップする。 ②:このカードは戦闘では破壊されない。
   ========================================================================= */
function u178AttackTarget(ctx){
  const a = gameState.pendingAttack;
  if(!a || a.attackerUid!==ctx.card.uid || a.targetUid==null) return null;
  const h = findCardByUid(a.targetUid);
  return (h && h.zone==='mz' && h.p===ctx.opponent) ? h : null;
}
defineUnifiedCardV4('VWXYZ－ドラゴン・カタパルトキャノン',[{
  key:'banish', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.ONFIELD, targetSide:'opponent',
  speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason='フィールドで表側表示の時に発動します'; return false; }
    if(!API.fieldCards({player:ctx.opponent}).length){ ctx.reason='相手フィールドにカードがありません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('VWXYZ－ドラゴン・カタパルトキャノン：除外する相手のカード', API.fieldCards({player:ctx.opponent}), t=>done([t])); },
  operation(ctx){ const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(r && r.p===ctx.opponent) API.banish(r, 'VWXYZ－ドラゴン・カタパルトキャノン'); },
  afterResolve(){}
},{
  key:'attack-position', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'opponent',
  speed:1, events:['onAttackDeclare'],
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && !!u178AttackTarget(ctx); },
  target(ctx, done){ const h = u178AttackTarget(ctx); done(h ? [h] : []); },
  operation(ctx){
    const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent) return;
    if(r.card.face==='down') act({type:'FX_SET_STATE', player:r.p, zone:'mz', index:r.index, face:'up', pos:'atk', reason:'VWXYZ－ドラゴン・カタパルトキャノン'});
    else API.changePosition(r, r.card.pos==='def' ? 'atk' : 'def', 'VWXYZ－ドラゴン・カタパルトキャノン');
  },
  afterResolve(){}
}],{
  type:'fusion', priority:1, targets:true, timing:['mainPhase'], countLimit:{n:1, effects:['banish']},
  passive:{onAttackDeclare(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && !!u178AttackTarget(ctx); }}
});
declareContactFusionS03('VWXYZ－ドラゴン・カタパルトキャノン');

defineScript('混沌幻魔アーミタイル', {
  type:'fusion', priority:1, battleProof:true,
  continuous:{scope:'self', from:['mz'], apply(target, self, info){
    const p = info && info.p!=null ? info.p : null;
    return (p!=null && gameState.activePlayer===p) ? {atk:10000} : null;
  }}
});
declareContactFusionS03('混沌幻魔アーミタイル');
