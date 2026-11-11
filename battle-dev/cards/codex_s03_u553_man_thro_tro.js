/* Codex S03-U553: 人投げトロール on existing cost / LP Actions.
   1103 text: 自分フィールド上に存在する通常モンスター(トークンを除く)1体を
   生け贄に捧げる度に、相手ライフに800ポイントダメージを与える。
   Historical wiki DB: 0 additional entries; the era FAQ is unconfirmed.
   Current official supplement cid6043 (2017-07-27) identifies an ignition effect,
   a non-token Normal Monster release COST (face-down allowed), and no target.
   This later evidence is recorded separately, not presented as a 2011 ruling.
   The old ENGINE_GAP's proposed central mandatory tribute observer is unnecessary. */
function u553NormalCostsS03(ctx){
  return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>!x.card.token && !x.card.cannotTribute
    && treatedAsNormal(x.card) && !geminiActiveS03(x.card)});
}
defineUnifiedCardV4('人投げトロール',[{key:'release-normal-burn',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return ctx.zone==='mz' && ctx.card.face==='up' && gameState.activePlayer===ctx.player
    && (gameState.phase==='main1'||gameState.phase==='main2') && u553NormalCostsS03(ctx).length>0;},
  cost(ctx,done){
    const pool=u553NormalCostsS03(ctx);if(!pool.length){done(false);return;}
    API.selectCard('人投げトロール：リリースする通常モンスター',pool,t=>{
      const h=t&&resolveTarget(t);if(!h||h.zone!=='mz'||h.p!==ctx.player){done(false);return;}
      API.sendToGrave(h,'人投げトロール（リリース）');done(true);
    });
  },
  operation(ctx){API.damageLP(ctx.opponent,800,'人投げトロール');},afterResolve(){}
}],{type:'monster',priority:1,timing:['mainPhase']});
