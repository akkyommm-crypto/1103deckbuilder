/* Auto cycle 47 — existing-engine piercing + LP recovery pickup.
   Engine changes: none. New primitive: none. */

function e9Pierce(info){
  if(!info||info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def') return 0;
  return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
}

/* 守備表示へ貫通。同じ戦闘のダメージステップ終了時、超過分だけ回復。 */
defineUnifiedCardV4('ハイパーサイコガンナー',[{
  key:'pierce-heal',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
  condition(ctx){
    const b=ctx.battle||{};
    return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='after'
      &&b.atkCard===ctx.card&&b.defCard&&b.defCard.pos==='def'
      &&Math.max(0,curATK(ctx.card)-curDEF(b.defCard))>0;
  },
  operation(ctx){
    const b=ctx.battle||{}, n=Math.max(0,curATK(ctx.card)-curDEF(b.defCard));
    if(n) API.recoverLP(ctx.player,n,'ハイパーサイコガンナー');
  },afterResolve(){}
}],{
  type:'synchro',priority:1,forced:true,dsTiming:'after',
  passive:{onDamageStep(ctx){
    const b=ctx.battle||{};
    return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='after'
      &&b.atkCard===ctx.card&&b.defCard&&b.defCard.pos==='def'
      &&Math.max(0,curATK(ctx.card)-curDEF(b.defCard))>0;
  }},
  continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage(info){return e9Pierce(info);}}
});
