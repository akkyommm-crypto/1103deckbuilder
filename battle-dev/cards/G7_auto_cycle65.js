/* Codex Auto Cycle 65 — 融合モンスターの攻撃回数・貫通・戦闘破壊ダメージ。 */
(function(){
function g7Pierce(info){
  if(!info||info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def') return 0;
  return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
}
function g7BattleKill(ctx){
  const b=ctx.battle||{},h=b.defCard&&locateCardAnyV4(b.defCard);
  return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'&&b.atkCard===ctx.card
    &&!!b.destroyedDef&&!!h&&h.zone==='grave';
}
function g7BurnOriginal(ctx,useHigher){
  const c=(ctx.battle||{}).defCard;if(!c)return;
  const d=dbOf(c),n=useHigher?Math.max(Number(d.atk)||0,Number(d.def)||0):Math.max(0,Number(d.atk)||0);
  if(n>0)API.damageLP(ctx.opponent,n);
}

defineUnifiedCardV4('サイバー・ツイン・ドラゴン',[],{
  type:'fusion',priority:1,attackLimit:2
});

defineUnifiedCardV4('サイバー・エンド・ドラゴン',[],{
  type:'fusion',priority:1,
  continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage:g7Pierce}
});

defineUnifiedCardV4('E・HERO シャイニング・フレア・ウィングマン',[{
  key:'burn-destroyed-original-atk',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onDamageStep'],condition:g7BattleKill,
  operation(ctx){g7BurnOriginal(ctx,false);},afterResolve(){}
}],{type:'fusion',priority:1,forced:true,dsTiming:'leave',
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self||self.face!=='up')return null;const h=locateCardAnyV4(self);if(!h)return null;
    const n=(gameState.players[h.p].grave||[]).filter(c=>isSetCardV4(dbOf(c),SETCODE.ELEMENTAL_HERO)).length;
    return n?{atk:n*300}:null;
  }},passive:{onDamageStep:g7BattleKill}});

defineUnifiedCardV4('E－HERO インフェルノ・ウィング',[{
  key:'burn-destroyed-higher-stat',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onDamageStep'],condition:g7BattleKill,
  operation(ctx){g7BurnOriginal(ctx,true);},afterResolve(){}
}],{type:'fusion',priority:1,forced:true,dsTiming:'leave',
  continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage:g7Pierce},
  passive:{onDamageStep:g7BattleKill}});
})();
