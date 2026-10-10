/* Codex Auto Cycle 62
   墓地の属性モンスター1体を除外する既存特殊召喚手順の同型3枚。
   engine変更なし。 */
(function(){
function g4AttrGrave(p,attr){
  return API.pileCards(p,'grave',x=>x.db&&x.db.k==='m'&&API.attrOf(x)===attr);
}
function g4Spirit(name,attr,effects,extraMeta){
  defineUnifiedCardV4(name,effects||[],Object.assign({
    type:'monster',priority:1,cannotNormalSummon:true,
    summonProcedure:{
      from:['hand'],positions:['atk','def'],
      condition(ctx){
        if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
        return g4AttrGrave(ctx.player,attr).length>0;
      },
      cost(ctx,done){
        API.selectCard(name+'：除外する'+attr+'属性モンスター',g4AttrGrave(ctx.player,attr),t=>{
          const h=resolveTarget(t);
          if(h) API.banish(h,name+'（特殊召喚手順）');
          done(!!h);
        });
      },
      execute(ctx){
        const h=locateCardAnyV4(ctx.card);
        if(!h||h.zone!=='hand') return;
        const pos=(ctx.position==='def'||ctx.pos==='def')?'def':'atk';
        API.specialSummon(ctx.player,'hand',h.index,pos,name);
      }
    }
  },extraMeta||{}));
}
function g4BattleOther(self){
  const b=gameState.battle;
  if(!b||!b.step||b.target==='direct') return null;
  const atk=(gameState.players[b.player].mz||[])[b.atkIdx];
  const def=(gameState.players[b.player===0?1:0].mz||[])[b.target];
  return atk===self?def:null;
}

g4Spirit('インフェルノ','炎',[],{
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self||self.face!=='up') return null;
    const other=g4BattleOther(self);
    return other&&currentAttributeV17(other)==='水'?{atk:700}:null;
  }}
});

g4Spirit('ギガンテス','地',[{
  key:'battle-destroy-spells-traps',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,
  speed:1,events:['onBattleDestroy'],
  condition(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;},
  operation(){
    API.fieldCards({filter:x=>x.db.k==='s'||x.db.k==='t'}).slice().forEach(t=>API.destroy(t,'ギガンテス'));
  },afterResolve(){}
}],{forced:true,passive:{onBattleDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;}}});

g4Spirit('シルフィード','風',[{
  key:'battle-random-discard',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,
  speed:1,events:['onBattleDestroy'],
  condition(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card&&API.foe(ctx).hand.length>0;},
  operation(ctx){
    const hand=API.foe(ctx).hand;
    if(hand.length) API.discard(ctx.opponent,duelRandomInt(hand.length,gameState),'シルフィード',{byEffect:true,byPlayer:ctx.player});
  },afterResolve(){}
}],{forced:true,passive:{onBattleDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;}}});
})();
