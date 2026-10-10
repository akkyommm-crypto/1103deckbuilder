/* =========================================================================
   System v4.2 — REMOVED-zone native effects
   ========================================================================= */
function v42CanReturnFromBanish(ctx){
  if(ctx.zone!=='banish'){ctx.reason='除外されている時に適用します';return false;}
  if(!v42WasBanishedThisTurn(ctx.card)){ctx.reason='このターンに除外されたカードではありません';return false;}
  if(gameState.players[ctx.player].temporaryFlags&&gameState.players[ctx.player].temporaryFlags.noSpecialSummon){ctx.reason='特殊召喚できません';return false;}
  if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
  return true;
}

defineUnifiedCardV4('異次元の偵察機',[{
  key:'end-return',type:EFFECT_TYPE.TRIGGER,range:LOCATION.REMOVED,targetRange:LOCATION.REMOVED,targetSide:'self',
  speed:1,events:['onEndPhase'],
  condition(ctx){ return v42CanReturnFromBanish(ctx); },
  operation(ctx){
    const h=findCardByUid(ensureCardUid(gameState,ctx.card)); if(!h||h.zone!=='banish'||!v42WasBanishedThisTurn(ctx.card)||!hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player,'banish',h.index,'atk','異次元の偵察機');
  },afterResolve(){},
}],{type:'monster',priority:1,forced:true,activateFrom:['banish'],passive:{onEndPhase(ctx){return ctx.zone==='banish'&&v42WasBanishedThisTurn(ctx.card);}}});

defineUnifiedCardV4('異次元の生還者',[{
  key:'end-return',type:EFFECT_TYPE.TRIGGER,range:LOCATION.REMOVED,targetRange:LOCATION.REMOVED,targetSide:'self',
  speed:1,events:['onEndPhase'],
  condition(ctx){
    if(!v42CanReturnFromBanish(ctx)) return false;
    const b=ctx.card&&ctx.card.banishInfo;
    if(!b||b.from!=='mz'||b.face!=='up'){ctx.reason='自分フィールドに表側表示で存在したこのカードが除外された場合のみ戻ります';return false;}
    return true;
  },
  operation(ctx){
    const h=findCardByUid(ensureCardUid(gameState,ctx.card)),b=ctx.card&&ctx.card.banishInfo;
    if(!h||h.zone!=='banish'||!b||b.from!=='mz'||b.face!=='up'||!v42WasBanishedThisTurn(ctx.card)||!hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player,'banish',h.index,'atk','異次元の生還者');
  },afterResolve(){},
}],{type:'monster',priority:1,forced:true,activateFrom:['banish'],passive:{onEndPhase(ctx){const b=ctx.card&&ctx.card.banishInfo;return ctx.zone==='banish'&&v42WasBanishedThisTurn(ctx.card)&&b&&b.from==='mz'&&b.face==='up';}}});
