/* CODEX-C09 — 光と闇の竜.
   Official 1103 behaviour:
   - cannot be Special Summoned; LIGHT and also DARK while face-up in the MZ;
   - mandatory activation-negation response, once per chain, to monster-effect
     activations and Spell/Trap *Card* activations; it does not destroy;
   - at resolution it needs both current ATK and DEF >=500, then negates and
     permanently loses 500/500 (the reduction resets on leave/face-down/disable);
   - mandatory destroyed-to-GY trigger from any zone: target a summonable own
     GY monster when one exists, destroy every card on the controller's field,
     then Special Summon the still-valid target. */
function c09LaddSelfFaceUp(ctx){
  const h=ctx&&ctx.card&&locateCardAnyV4(ctx.card);
  return h&&h.zone==='mz'&&h.p===ctx.player&&h.card.face==='up' ? h : null;
}
function c09LaddActivationLink(ctx){
  const e=ctx&&ctx.event, l=e&&typeof activationLinkV12==='function'?activationLinkV12(gameState,e):null;
  if(!e||!l||l.chainId!==e.chainId)return null;
  if(e.kind==='monster')return l;
  if((e.kind==='spell'||e.kind==='trap')&&l.cardActivationS03===true)return l;
  return null;
}
function c09LaddAlreadyUsedThisChain(card){
  return !!(card&&Array.isArray(gameState.chain)&&gameState.chain.some(l=>l&&l.uid===card.uid&&l.name==='光と闇の竜'));
}
function c09LaddDestroyedSelf(ctx){
  const g=ctx&&ctx.card&&ctx.card.graveInfo, e=ctx&&ctx.event;
  return !!(ctx&&ctx.zone==='grave'&&g&&g.byDestroy===true&&e&&
    (e.card===ctx.card||(e.uid!=null&&e.uid===ctx.card.uid)));
}
function c09LaddReviveCandidates(ctx){
  return API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.card!==ctx.card&&
    (typeof canEffectSpecialSummonS03!=='function'||canEffectSpecialSummonS03(x.card,'grave','光と闇の竜')));
}

defineUnifiedCardV4('光と闇の竜',[
  {
    key:'negate-activation',type:EFFECT_TYPE.QUICK,range:LOCATION.MZONE,speed:2,events:['onActivateSuccess'],
    condition(ctx){
      if(!c09LaddSelfFaceUp(ctx)){ctx.reason='表側表示でモンスターゾーンに存在する場合に発動します';return false;}
      if(c09LaddAlreadyUsedThisChain(ctx.card)){ctx.reason='同一チェーン上では1度しか発動しません';return false;}
      if(!c09LaddActivationLink(ctx)){ctx.reason='効果モンスターの効果または魔法・罠カードの発動にチェーンします';return false;}
      return true;
    },
    operation(ctx){
      const self=c09LaddSelfFaceUp(ctx), target=c09LaddActivationLink(ctx);
      if(!self||!target||ctx.card.battleDestroyed||curATK(ctx.card)<500||curDEF(ctx.card)<500||target.activationNegated===true)return;
      if(!API.negateChainLink(ctx.event,'activation','光と闇の竜',false))return;
      v4RegisterStatModifier(self,{atk:-500,def:-500},{controller:ctx.player,code:'光と闇の竜 -500',targetCard:ctx.card,resetMask:RESET.LEAVE|RESET.FACE_DOWN|RESET.DISABLE});
    },afterResolve(){}
  },
  {
    key:'destroyed-revive',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['onDestroy'],forced:true,
    condition(ctx){if(!c09LaddDestroyedSelf(ctx)){ctx.reason='このカードが破壊され墓地へ送られた時に発動します';return false;}return true;},
    target(ctx,done){
      const list=c09LaddReviveCandidates(ctx);
      if(!list.length){done([]);return;}
      API.selectCard('光と闇の竜：特殊召喚するモンスター',list,t=>done([t]));
    },
    operation(ctx){
      API.destroyAll('mz',ctx.player,'光と闇の竜');
      API.destroyAll('sz',ctx.player,'光と闇の竜');
      API.destroyAll('field',ctx.player,'光と闇の竜');
      const t=ctx.selectedTargets&&ctx.selectedTargets[0], r=t&&resolveTarget(t);
      if(r&&r.p===ctx.player&&r.zone==='grave')API.specialSummon(ctx.player,'grave',r.index,'atk','光と闇の竜');
    },afterResolve(){}
  }
],{
  type:'monster',priority:2,quickEffect:true,cannotSpecialSummon:true,activateFrom:['mz','grave'],targets:true,forced:true,
  includesSpecialSummon:true,destroysFieldV46:true,
  continuous:{scope:'self',from:['mz'],apply(){return null;},additionalAttributes(card,self){return card===self&&card.face==='up'?['闇']:[];}}
});

declareForcedActivationResponseS03(['光と闇の竜']);
