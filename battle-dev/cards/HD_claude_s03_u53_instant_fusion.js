/* =========================================================================
   S03-U53 — 簡易融合
   -------------------------------------------------------------------------
   2011-dated FAQ answers carried by the oldest available yugioh-wiki source
   (revision caveat recorded in shared handoff): Level 5 or lower Fusion
   Monster only; not Synchro; activation negated means it is not counted for
   the one-card-per-turn activation limit. The summoned Fusion Monster cannot
   attack and is destroyed during the End Phase if it remains the same card.
   ========================================================================= */
(function(){
function s03u53InstantFusionPool(p){
  return API.pileCards(p,'ex', x=>{
    const d=x.db||{};
    return d.k==='m' && d.ex===true && (d.lv||99)<=5 && Array.isArray(d.st) && d.st.includes('融合');
  });
}
function s03u53SummonInstantFusion(player,t){
  const r=t&&resolveTarget(t);
  if(!r || r.zone!=='ex' || r.p!==player) return null;
  const before=r.card;
  ensureCardUid(gameState,before);
  act({type:'FX_EX_SUMMON',player,exIndex:r.index,materials:[],kind:'fusion',pos:'atk'});
  const h=findCardByUid(before.uid);
  if(!h || h.zone!=='mz' || h.p!==player) return null;
  act({type:'FX_CARD_FLAG_V46',player:h.p,zone:'mz',index:h.index,flag:'cannotAttack',value:true,reason:'簡易融合：攻撃不可',silent:true});
  const now=findCardByUid(before.uid);
  if(now && now.zone==='mz'){
    v340ScheduleEndDestroy(now.card,player,'簡易融合：特殊召喚した融合モンスターを破壊');
    queueSpecialSummonSuccessV2(player,now.card,'fusion');
  }
  return before;
}

defineUnifiedCardV4('簡易融合',[{
  key:'instant-fusion',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){
    if(API.me(ctx).lp<=1000){ctx.reason='1000LPを払えません';return false;}
    if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
    if(!s03u53InstantFusionPool(ctx.player).length){ctx.reason='EXデッキにレベル5以下の融合モンスターがいません';return false;}
    return true;
  },
  cost(ctx,done){API.payCost(ctx.player,1000);done(true);},
  operation(ctx){
    API.requestChoice({player:ctx.player,kind:'card',title:'簡易融合：特殊召喚するレベル5以下の融合モンスター',
      candidates:s03u53InstantFusionPool(ctx.player),min:1,max:1,cancelable:false,
      resume:{handler:'s03u53.instant-fusion-summon',args:{player:ctx.player}},meta:{scriptName:'簡易融合'}});
  },
  afterResolve(ctx){v4DefaultAfterResolve(ctx);}
}],{type:'spell',priority:1,nameLimit:true,countLimit:1,targets:false,blocksIfNoSpecialSummon:true,includesSpecialSummon:true});

API.registerChoiceHandler('s03u53.instant-fusion-summon',(answer,args)=>{
  const picked=(typeof v49P1ChoiceCards==='function')?v49P1ChoiceCards(answer)[0]:null;
  s03u53SummonInstantFusion(args.player,picked);
});

declareActivationNegatedReleaseS03('簡易融合',{count:true});
})();
