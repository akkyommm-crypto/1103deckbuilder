/* =========================================================================
   S03-U176 — more contact-fusion cards (engine/1ZW) with their whole texts.
   E・HERO アクア・ネオス: 1ターンに1度、手札を1枚捨てる事で、相手の手札をランダムに1枚選んで破壊する。 / エンドフェイズ時、エクストラデッキに戻る。
   E・HERO マリン・ネオス: 相手の手札1枚をランダムに選択し破壊する。この効果は1ターンに1度しか使用できない。 (no End Phase return)
   XY－ドラゴン・キャノン / XZ－キャタピラー・キャノン / YZ－キャタピラー・ドラゴン / XYZ－ドラゴン・キャノン: 墓地からの特殊召喚はできない。
     ①:手札を1枚捨て、相手フィールドの（表側表示の魔法・罠｜裏側表示の魔法・罠｜裏側表示モンスター｜カード）1枚を対象として発動できる。破壊する。
   VW－タイガー・カタパルト: ①:手札を1枚捨て、相手フィールドのモンスター1体を対象として発動できる。表示形式を変更する（リバースモンスターの効果は
     発動しない）。
   The random hand card is drawn inside the Action (engine/1ZX).
   ========================================================================= */
function u176DiscardCost(name){
  return function(ctx, done){
    API.selectCard(`${name}：捨てる手札`, API.pileCards(ctx.player,'hand'), t=>{
      const r = resolveTarget(t); if(!r){ done(false); return; }
      API.discard(ctx.player, r.index, `${name}（コスト）`, {byEffect:false}); done(true);
    });
  };
}
function u176HandDestroyEffect(name, withCost){
  return {
    key:'hand-destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.HAND, targetSide:'opponent',
    speed:1, events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason='フィールドで表側表示の時に発動します'; return false; }
      if(!API.foe(ctx).hand.length){ ctx.reason='相手の手札がありません'; return false; }
      if(withCost && !API.me(ctx).hand.length){ ctx.reason='捨てる手札がありません'; return false; }
      return true;
    },
    cost: withCost ? u176DiscardCost(name) : null,
    operation(ctx){ destroyRandomHandCardS03(ctx.opponent, name, ctx.player); },
    afterResolve(){}
  };
}
defineUnifiedCardV4('E・HERO アクア・ネオス',[u176HandDestroyEffect('E・HERO アクア・ネオス', true), endPhaseReturnExEffectS03('E・HERO アクア・ネオス')],{
  type:'fusion', priority:1, countLimit:{n:1, effects:['hand-destroy']}, timing:['mainPhase'],
  passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}}
});
declareContactFusionS03('E・HERO アクア・ネオス');

defineUnifiedCardV4('E・HERO マリン・ネオス',[u176HandDestroyEffect('E・HERO マリン・ネオス', false)],{
  type:'fusion', priority:1, countLimit:{n:1, effects:['hand-destroy']}, timing:['mainPhase']
});
declareContactFusionS03('E・HERO マリン・ネオス');

function u176CannonScript(name, what, filter, graveBan){
  const def = {
    type:'fusion', priority:1, targets:true, timing:['mainPhase'],
    condition(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason='フィールドで表側表示の時に発動します'; return false; }
      if(!API.me(ctx).hand.length){ ctx.reason='捨てる手札がありません'; return false; }
      if(!API.fieldCards({player:ctx.opponent, filter}).length){ ctx.reason=`相手フィールドに${what}がありません`; return false; }
      return true;
    },
    cost: u176DiscardCost(name),
    selectTargets(ctx, done){ API.selectCard(`${name}：対象にする${what}`, API.fieldCards({player:ctx.opponent, filter}), t=>done([t])); },
    resolve(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0];
      const r = t && resolveTarget(t);
      if(r && r.p===ctx.opponent && filter(r)) API.destroy(r, name);
    }
  };
  if(graveBan) def.noGraveSpecialSummonS03 = true;
  defineScript(name, def);
  declareContactFusionS03(name);
}
u176CannonScript('XY－ドラゴン・キャノン', '表側表示の魔法・罠カード', x=>(x.zone==='sz'||x.zone==='field') && x.card.face==='up', true);
u176CannonScript('XZ－キャタピラー・キャノン', '裏側表示の魔法・罠カード', x=>(x.zone==='sz'||x.zone==='field') && x.card.face==='down', true);
u176CannonScript('YZ－キャタピラー・ドラゴン', '裏側表示モンスター', x=>x.zone==='mz' && x.card.face==='down', true);
u176CannonScript('XYZ－ドラゴン・キャノン', 'カード', x=>true, true);

defineScript('VW－タイガー・カタパルト', {
  type:'fusion', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason='フィールドで表側表示の時に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason='捨てる手札がありません'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz'}).length){ ctx.reason='相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  cost: u176DiscardCost('VW－タイガー・カタパルト'),
  selectTargets(ctx, done){ API.selectCard('VW－タイガー・カタパルト：表示形式を変更する相手モンスター', API.fieldCards({player:ctx.opponent, zone:'mz'}), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.p!==ctx.opponent || r.zone!=='mz') return;
    /* face-down Defense → face-up Attack without the flip effect; face-up ↔ the other position */
    if(r.card.face==='down') API.flipFaceUpWithoutFlipEffect(r,'atk','VW－タイガー・カタパルト');
    else API.changePosition(r, r.card.pos==='def' ? 'atk' : 'def', 'VW－タイガー・カタパルト');
  }
});
declareContactFusionS03('VW－タイガー・カタパルト');
