/* CODEX-C14 — スキル・サクセサー (2009 text).
   The first effect is the Normal Trap Card activation.  The second is a Trap
   effect activated from the GY: only on its owner's turn, not on the turn the
   card reached the GY, and banishing this card is the activation cost. */
function c14SkillSuccessorTargets(ctx){
  return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'});
}

defineUnifiedCardV4('スキル・サクセサー',[
  {
    key:'field-boost-400',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.MZONE,targetSide:'self',speed:2,events:['activate'],
    condition(ctx){
      if(!c14SkillSuccessorTargets(ctx).length){ctx.reason='自分フィールドに表側表示モンスターがいません';return false;}
      return true;
    },
    target(ctx,done){API.selectCard('スキル・サクセサー：攻撃力を400アップするモンスター',c14SkillSuccessorTargets(ctx),t=>done([t]));},
    operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(t)API.modAtk(t,400,0,'endPhase','スキル・サクセサー');},
    afterResolve(){}
  },
  {
    key:'grave-boost-800',type:EFFECT_TYPE.QUICK,range:LOCATION.GRAVE,targetRange:LOCATION.MZONE,targetSide:'self',speed:2,events:['activate'],
    condition(ctx){
      if(ctx.player!==gameState.activePlayer){ctx.reason='自分のターンにのみ発動できます';return false;}
      const g=ctx.card&&ctx.card.graveInfo;
      if(g&&Number(g.turn)===Number(gameState.turn)){ctx.reason='墓地へ送られたターンには発動できません';return false;}
      if(!c14SkillSuccessorTargets(ctx).length){ctx.reason='自分フィールドに表側表示モンスターがいません';return false;}
      return true;
    },
    cost(ctx,done){
      const h=locateCardAnyV4(ctx.card);
      if(!h||h.zone!=='grave'){done(false);return;}
      API.banish(h,'スキル・サクセサー（コスト）');
      done(true);
    },
    target(ctx,done){API.selectCard('スキル・サクセサー：攻撃力を800アップするモンスター',c14SkillSuccessorTargets(ctx),t=>done([t]));},
    operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(t)API.modAtk(t,800,0,'endPhase','スキル・サクセサー');},
    afterResolve(){}
  }
],{type:'trap',priority:2,quickEffect:true,activateFrom:['grave'],targets:true});
