/* Auto cycle 54 — existing continuous stat + self-cost wipe pickup.
   Engine changes: none. New primitive: none. */

function f6OwnGraveDarkCount(p){
  return API.pileCards(p,'grave',x=>x.db.k==='m'&&x.db.at==='闇').length;
}
function f6OpponentFaceDownMonsters(p){
  const foe=(p===0)?1:0;
  return API.fieldCards({player:foe,zone:'mz',filter:x=>x.card.face==='down'});
}

defineUnifiedCardV4('ダーク・アサシン',[{
  key:'dark-grave-wipe',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&f6OwnGraveDarkCount(ctx.player)>=5&&f6OpponentFaceDownMonsters(ctx.player).length>0;},
  cost(ctx,done){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.sendToGrave(h,'ダーク・アサシン（コスト）');
    done(!!h);
  },
  operation(ctx){f6OpponentFaceDownMonsters(ctx.player).slice().forEach(t=>API.destroy(t,'ダーク・アサシン'));},
  afterResolve(){}
}],{
  type:'monster',priority:1,timing:['mainPhase'],destroysFieldV46:true,
  continuous:{scope:'self',from:['mz'],apply(card,self,info){
    if(card!==self||card.face!=='up') return null;
    const n=f6OwnGraveDarkCount(info.p);
    if(n<=1) return {atk:-400};
    if(n<=4) return {atk:400};
    return null;
  }}
});
