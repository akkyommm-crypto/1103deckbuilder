/* Codex Auto Cycle 64 — 戦闘破壊後の元々のATK参照を持つ融合3枚。
   Battle v6 / LPChange v18 / DestructionProtection v21 の既存経路のみ。 */
(function(){
function g6BattleKill(ctx){
  const b=ctx.battle||{};
  const h=b.defCard&&locateCardAnyV4(b.defCard);
  return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'
    &&b.atkCard===ctx.card&&!!b.destroyedDef&&!!h&&h.zone==='grave';
}
function g6DestroyedOriginalAtk(ctx){
  const c=(ctx.battle||{}).defCard;
  return c?Math.max(0,Number(dbOf(c).atk)||0):0;
}
function g6Pierce(info){
  if(!info||info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def') return 0;
  return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
}

defineUnifiedCardV4('E・HERO フレイム・ウィングマン',[{
  key:'burn-destroyed-original-atk',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onDamageStep'],condition:g6BattleKill,
  operation(ctx){const n=g6DestroyedOriginalAtk(ctx);if(n)API.damageLP(ctx.opponent,n);},afterResolve(){}
}],{type:'fusion',priority:1,forced:true,dsTiming:'leave',passive:{onDamageStep:g6BattleKill}});

defineUnifiedCardV4('E・HERO スチーム・ヒーラー',[{
  key:'recover-destroyed-original-atk',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onDamageStep'],condition:g6BattleKill,
  operation(ctx){const n=g6DestroyedOriginalAtk(ctx);if(n)API.recoverLP(ctx.player,n);},afterResolve(){}
}],{type:'fusion',priority:1,forced:true,dsTiming:'leave',passive:{onDamageStep:g6BattleKill}});

defineUnifiedCardV4('アルティメットサイキッカー',[{
  key:'recover-destroyed-original-atk',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onDamageStep'],condition:g6BattleKill,
  operation(ctx){const n=g6DestroyedOriginalAtk(ctx);if(n)API.recoverLP(ctx.player,n);},afterResolve(){}
}],{type:'fusion',priority:1,forced:true,dsTiming:'leave',
  protectV21:{key:'g6.effect-proof',effect:true,label:'アルティメットサイキッカー'},
  continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage:g6Pierce},
  passive:{onDamageStep:g6BattleKill}});
})();
