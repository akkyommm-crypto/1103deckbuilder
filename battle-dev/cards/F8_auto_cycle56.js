/* Codex Auto Cycle 56
   P4 exact GENEX + v17 current attribute + v21 destroy gate. */
(function(){
function f8Face(p){ return API.fieldCards({player:p,zone:'mz',filter:x=>x.card.face==='up'}); }
function f8FireGenexCost(ctx){
  return f8Face(ctx.player).filter(x=>API.attrOf(x)==='炎'&&isSetCardV4(x.db,SETCODE.GENEX));
}
function f8OpponentFaceMonsters(ctx){
  return API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'});
}
defineUnifiedCardV4('A・ジェネクス・ボルキャノン',[{
  key:'send-fire-genex-destroy-burn',
  type:EFFECT_TYPE.IGNITION,
  range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,
  targetSide:'opponent',
  speed:1,
  events:['activate'],
  condition(ctx){
    return f8FireGenexCost(ctx).length>0 && f8OpponentFaceMonsters(ctx).length>0;
  },
  cost(ctx,done){
    API.selectCard('A・ジェネクス・ボルキャノン：墓地へ送る炎属性ジェネクス',f8FireGenexCost(ctx),t=>{
      const h=resolveTarget(t);
      if(h) API.sendToGrave(h,'A・ジェネクス・ボルキャノン（コスト）');
      done(!!h);
    });
  },
  target(ctx,done){
    API.selectCard('A・ジェネクス・ボルキャノン：破壊する相手表側モンスター',f8OpponentFaceMonsters(ctx),t=>done([t]));
  },
  operation(ctx){
    const h=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!h) return;
    const uid=ensureCardUid(gameState,h.card), lv=Math.max(0,curLV(h.card)||0), mark=API.destroyMarkS03();
    API.destroy(h,'A・ジェネクス・ボルキャノン');
    /* S03-U294: damage only if it was destroyed, after any substitute decision (engine/1ZZO) */
    API.afterDestroyS03('s03u294.if-destroyed-lp',{mark,uids:[uid],to:ctx.opponent,n:lv*400,op:'damage'});
  },
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase'],targets:true,destroysFieldV46:true});
})();
