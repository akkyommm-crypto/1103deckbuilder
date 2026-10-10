/* Codex Auto Cycle 61
   既存 summonProcedure + banish + continuous stat only. */
(function(){
function g3AttrGrave(p,attr){
  return API.pileCards(p,'grave',x=>x.db&&x.db.k==='m'&&API.attrOf(x)===attr);
}
function g3Spirit(name,attr,boostOwner){
  defineUnifiedCardV4(name,[],{
    type:'monster',
    priority:1,
    cannotNormalSummon:true,
    summonProcedure:{
      from:['hand'],
      positions:['atk','def'],
      condition(ctx){
        if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason='モンスターゾーンが一杯です'; return false; }
        return g3AttrGrave(ctx.player,attr).length>0;
      },
      cost(ctx,done){
        API.selectCard(name+'：除外する'+attr+'属性モンスター',g3AttrGrave(ctx.player,attr),t=>{
          const h=resolveTarget(t);
          if(h) API.banish(h,name+'（特殊召喚手順）');
          done(!!h);
        });
      },
      execute(ctx){
        const pile=gameState.players[ctx.player].hand||[];
        const i=pile.indexOf(ctx.card);
        if(i<0) return;
        const pos=(ctx.position==='def'||ctx.pos==='def')?'def':'atk';
        API.specialSummon(ctx.player,'hand',i,pos,name);
      }
    },
    continuous:{
      scope:'self',
      from:['mz'],
      apply(card,self){
        const h=locateCardAnyV4(self);
        if(!h||h.zone!=='mz'||self.face!=='up'||gameState.phase!=='battle') return null;
        const mine=(gameState.activePlayer===h.p);
        if((boostOwner==='self'&&mine)||(boostOwner==='opponent'&&!mine)) return {atk:300};
        return null;
      }
    }
  });
}
g3Spirit('岩の精霊 タイタン','地','opponent');
g3Spirit('炎の精霊 イフリート','炎','self');
})();
