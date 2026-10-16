/* CODEX-C15 — A・O・J リサーチャー.
   Once per turn, discard one card to target an opponent's face-down Defense
   Position monster and turn it face-up Attack Position without activating
   its Flip effect. */
function c15AojResearcherTargets(ctx){
  return API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='down'&&x.card.pos==='def'});
}

defineUnifiedCardV4('A・O・J リサーチャー',[{
  key:'discard-flip-without-effect',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'){ctx.reason='表側表示のこのカードが必要です';return false;}
    if(!API.me(ctx).hand.length){ctx.reason='捨てる手札がありません';return false;}
    if(!c15AojResearcherTargets(ctx).length){ctx.reason='相手の裏側守備表示モンスターがいません';return false;}
    return true;
  },
  cost(ctx,done){
    API.selectCard('A・O・J リサーチャー：捨てる手札',API.pileCards(ctx.player,'hand'),t=>{
      const h=resolveTarget(t);
      if(!h||h.p!==ctx.player||h.zone!=='hand'){done(false);return;}
      API.discard(ctx.player,h.index,'A・O・J リサーチャー（コスト）',{byEffect:false,byPlayer:ctx.player});
      done(true);
    });
  },
  target(ctx,done){API.selectCard('A・O・J リサーチャー：表側攻撃表示にするモンスター',c15AojResearcherTargets(ctx),t=>done([t]));},
  operation(ctx){
    const h=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(h&&h.p===ctx.opponent&&h.zone==='mz'&&h.card.face==='down'&&h.card.pos==='def')
      API.flipFaceUpWithoutFlipEffect(h,'atk','A・O・J リサーチャー');
  },
  afterResolve(){}
}],{type:'monster',priority:1,timing:['mainPhase'],targets:true,countLimit:1});
