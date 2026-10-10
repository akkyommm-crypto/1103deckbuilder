/* Auto cycle 48 — existing Scheduler + StatModifier pickup.
   Engine changes: none. New primitive: none. */

function f0OwnFaceUpPlants(p){
  return API.fieldCards({player:p,zone:'mz',filter:x=>x.card.face==='up'&&API.raceOf(x)==='植物'});
}
function f0OwnGravePlants(p){
  return API.pileCards(p,'grave',x=>x.db.k==='m'&&x.db.ra==='植物');
}

API.registerScheduleHandler('f0.plantOvergrowthDestroy',(args)=>{
  const p=(args&&args.player===1)?1:0;
  f0OwnFaceUpPlants(p).slice().forEach(t=>API.destroy(t,(args&&args.reason)||'狂植物の氾濫'));
});

/* 自分フィールドの表側植物族は、自分墓地の植物族×300アップ。
   このターンのエンドフェイズに自分フィールドの表側植物族を全て破壊する。 */
defineUnifiedCardV4('狂植物の氾濫',[{
  key:'plant-overgrowth',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return f0OwnFaceUpPlants(ctx.player).length>0;},
  operation(ctx){
    const n=f0OwnGravePlants(ctx.player).length*300;
    f0OwnFaceUpPlants(ctx.player).forEach(t=>{
      if(n) v4RegisterStatModifier(t,{atk:n},{controller:ctx.player,code:'狂植物の氾濫',targetCard:t.card,resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    });
    API.schedule({at:'endPhase',turns:0,player:ctx.player,handler:'f0.plantOvergrowthDestroy',
      args:{player:ctx.player,reason:'狂植物の氾濫'},note:'狂植物の氾濫'});
  },afterResolve(){}
}],{type:'spell',priority:2});
