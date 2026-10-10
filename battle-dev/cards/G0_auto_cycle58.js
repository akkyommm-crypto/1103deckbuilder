/* Codex Auto Cycle 58
   既存 Battle/Stat/Destroy 基盤のみ: 鳥獣族数参照 + 相手魔法罠破壊。 */
(function(){
function g0OwnFaceWinged(p){
  return API.fieldCards({player:p,zone:'mz',filter:x=>x.card.face==='up'&&API.raceOf(x)==='鳥獣'});
}
function g0OpponentSpellTrap(ctx){
  return API.fieldCards({player:ctx.opponent,filter:x=>['sz','field'].includes(x.zone)&&['s','t'].includes(x.db.k)});
}
defineUnifiedCardV4('ブラッドストーム',[{
  key:'destroy-opponent-st',
  type:EFFECT_TYPE.IGNITION,
  range:LOCATION.MZONE,
  targetRange:LOCATION.SZONE|LOCATION.FIELD,
  targetSide:'opponent',
  speed:1,
  events:['activate'],
  condition(ctx){
    return ctx.card.face==='up' && g0OwnFaceWinged(ctx.player).length>=3 && g0OpponentSpellTrap(ctx).length>0;
  },
  target(ctx,done){
    API.selectCard('ブラッドストーム：破壊する相手の魔法・罠',g0OpponentSpellTrap(ctx),t=>done([t]));
  },
  operation(ctx){
    const h=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(h) API.destroy(h,'ブラッドストーム');
  },
  afterResolve(){}
}],{
  type:'monster',
  priority:1,
  countLimit:1,
  timing:['mainPhase'],
  targets:true,
  destroysFieldV46:true,
  continuous:{
    scope:'self',
    from:['mz'],
    apply(card,self){
      const h=locateCardAnyV4(self);
      if(!h||h.zone!=='mz'||self.face!=='up') return null;
      return {atk:g0OwnFaceWinged(h.p).length*100};
    }
  }
});
})();
