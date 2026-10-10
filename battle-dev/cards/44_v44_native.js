/* =========================================================================
   System v4.4 — Unified Effect migration/addition batch
   -------------------------------------------------------------------------
   Adds classic FLIP effects and Naturia negation effects using the v4 split:
   condition -> cost -> target -> operation.
   ========================================================================= */
function v44FlipSelfCondition(ctx){
  if(ctx.eventName!=='onFlip'||ctx.zone!=='mz'){ctx.reason='このカードがリバースした場合に発動します';return false;}
  return true;
}
function v44PickOneThenOptionalSecond(title,pool,done){
  const src=(pool||[]).slice();
  if(!src.length){done([]);return;}
  API.selectCard(title,src,first=>{
    const chosen=[first], left=src.filter(x=>x.card!==first.card);
    if(!left.length){done(chosen);return;}
    API.confirm(title,'もう1体選びますか？',()=>API.selectCard(title,left,second=>done([first,second])),()=>done(chosen));
  });
}

/* ペンギン・ソルジャー — 発動時に1～2体を対象に固定。 */
defineUnifiedCardV4('ペンギン・ソルジャー',[{
  key:'flip-bounce',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['onFlip'],
  condition(ctx){if(!v44FlipSelfCondition(ctx))return false;const p=API.fieldCards({zone:'mz'});if(!p.length){ctx.reason='フィールドにモンスターがいません';return false;}return true;},
  target(ctx,done){v44PickOneThenOptionalSecond('ペンギン・ソルジャー：手札に戻すモンスター',API.fieldCards({zone:'mz'}),done);},
  operation(ctx){(ctx.selectedTargets||[]).forEach(t=>API.returnToHand(t,'ペンギン・ソルジャー'));},afterResolve(){}
}],{type:'monster',priority:1,targets:true,passive:{onFlip(ctx){return ctx.zone==='mz';}}});

/* 人喰い虫 — 強制リバース効果。自分自身も対象にできる。 */
defineUnifiedCardV4('人喰い虫',[{
  key:'flip-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['onFlip'],
  condition(ctx){if(!v44FlipSelfCondition(ctx))return false;return API.fieldCards({zone:'mz'}).length>0;},
  target(ctx,done){API.selectCard('人喰い虫：破壊するモンスター',API.fieldCards({zone:'mz'}),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(t)API.destroy(t,'人喰い虫');},afterResolve(){}
}],{type:'monster',priority:1,targets:true,forced:true,passive:{onFlip(ctx){return ctx.zone==='mz';}}});

/* 聖なる魔術師 — 墓地の魔法を対象に取って回収。 */
defineUnifiedCardV4('聖なる魔術師',[{
  key:'flip-spell-recover',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['onFlip'],
  condition(ctx){if(!v44FlipSelfCondition(ctx))return false;const p=API.pileCards(ctx.player,'grave',x=>x.db.k==='s');if(!p.length){ctx.reason='墓地に魔法カードがありません';return false;}return true;},
  target(ctx,done){API.selectCard('聖なる魔術師：手札に加える魔法',API.pileCards(ctx.player,'grave',x=>x.db.k==='s'),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(t)API.returnToHand(t,'聖なる魔術師');},afterResolve(){}
}],{type:'monster',priority:1,targets:true,forced:true,passive:{onFlip(ctx){return ctx.zone==='mz';}}});

/* 闇の仮面 — 墓地の罠を対象に取って回収。 */
defineUnifiedCardV4('闇の仮面',[{
  key:'flip-trap-recover',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['onFlip'],
  condition(ctx){if(!v44FlipSelfCondition(ctx))return false;const p=API.pileCards(ctx.player,'grave',x=>x.db.k==='t');if(!p.length){ctx.reason='墓地に罠カードがありません';return false;}return true;},
  target(ctx,done){API.selectCard('闇の仮面：手札に加える罠',API.pileCards(ctx.player,'grave',x=>x.db.k==='t'),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(t)API.returnToHand(t,'闇の仮面');},afterResolve(){}
}],{type:'monster',priority:1,targets:true,forced:true,passive:{onFlip(ctx){return ctx.zone==='mz';}}});

function v44TopOpponentChain(ctx,kind){
  if(!gameState.chain.length)return null;
  const top=gameState.chain[gameState.chain.length-1];
  if(!top||top.player!==ctx.opponent)return null;
  const d=CARD_DB[top.cardId]||{};
  return d.k===kind?top:null;
}

/* ナチュル・ビースト — デッキ上2枚を墓地へ送るのは発動コスト。 */
defineUnifiedCardV4('ナチュル・ビースト',[{
  key:'negate-spell',type:EFFECT_TYPE.QUICK,range:LOCATION.MZONE,speed:2,
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'){ctx.reason='表側表示でフィールドに存在する必要があります';return false;}
    if(!v44TopOpponentChain(ctx,'s')){ctx.reason='相手の魔法カードの発動にチェーンします';return false;}
    if(gameState.players[ctx.player].deck.length<2){ctx.reason='デッキの上から2枚を墓地へ送れません';return false;}
    return true;
  },
  cost(ctx,done){API.millTop(ctx.player,2,'ナチュル・ビースト（コスト）');done(true);},
  operation(){negatePreviousChainLinkV2('ナチュル・ビースト',true,'activation');},afterResolve(){}
}],{type:'synchro',priority:2,quickEffect:true});

/* ナチュル・ランドオルス — 手札の魔法1枚を「墓地へ送る」コスト。 */
defineUnifiedCardV4('ナチュル・ランドオルス',[{
  key:'negate-monster',type:EFFECT_TYPE.QUICK,range:LOCATION.MZONE,speed:2,
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'){ctx.reason='表側表示でフィールドに存在する必要があります';return false;}
    if(!v44TopOpponentChain(ctx,'m')){ctx.reason='相手の効果モンスターの効果の発動にチェーンします';return false;}
    const spells=API.pileCards(ctx.player,'hand',x=>x.db.k==='s');
    if(!spells.length){ctx.reason='手札に墓地へ送れる魔法カードがありません';return false;}
    return true;
  },
  cost(ctx,done){API.selectCard('ナチュル・ランドオルス：墓地へ送る魔法（コスト）',API.pileCards(ctx.player,'hand',x=>x.db.k==='s'),t=>{API.sendHandToGrave(ctx.player,t.index,'ナチュル・ランドオルス（コスト）');done(true);});},
  operation(){negatePreviousChainLinkV2('ナチュル・ランドオルス',true,'activation');},afterResolve(){}
}],{type:'synchro',priority:2,quickEffect:true});
