/* Codex Auto Cycle 55
   既存engineのみ: 代替通常召喚 / 自己特殊召喚手順。
   登録名はcoverage scanner用に文字列リテラルで保持する。 */
(function(){
function f7FaceUpPlant(t){ return t&&t.card&&t.card.face==='up'&&API.raceOf(t)==='植物'; }

defineUnifiedCardV4('光神機－桜火',[{
  key:'send-self-end',
  type:EFFECT_TYPE.TRIGGER,
  range:LOCATION.MZONE,
  speed:1,
  events:['onEndPhase'],
  condition(ctx){
    return ctx.zone==='mz'
      && ctx.player===gameState.activePlayer
      && ctx.card.face==='up'
      && ctx.card.normalSummonMethod==='majesticMechOhka0';
  },
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h&&h.zone==='mz') API.sendToGrave(h,'光神機－桜火');
  },
  afterResolve(){}
}],{
  type:'monster',
  priority:1,
  forced:true,
  normalSummonProcedure:{
    includeStandard:true,
    methods:[{
      id:'majesticMechOhka0',
      tributes:0,
      modes:['summon'],
      summonLabel:'リリースなしで召喚'
    }]
  },
  passive:{ onEndPhase(ctx){ return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.player===gameState.activePlayer; } }
});

defineUnifiedCardV4('魔天使ローズ・ソーサラー',[],{
  type:'monster',
  priority:1,
  summonProcedure:{
    from:['hand'],
    positions:['atk','def'],
    condition(ctx){
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason='モンスターゾーンが一杯です'; return false; }
      return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>f7FaceUpPlant(x)}).length>0;
    },
    cost(ctx,done){
      const q=API.fieldCards({player:ctx.player,zone:'mz',filter:x=>f7FaceUpPlant(x)});
      API.selectCard('魔天使ローズ・ソーサラー：手札へ戻す植物族',q,t=>{
        const r=resolveTarget(t);
        if(!r){ done(false); return; }
        API.returnToHand(r,'魔天使ローズ・ソーサラー（特殊召喚手順）');
        done(true);
      });
    },
    execute(ctx){
      const zone=ctx.zone||'hand';
      const me=gameState.players[ctx.player];
      const pile=me[zone]||[];
      const i=pile.indexOf(ctx.card);
      if(i<0) return;
      const pos=(ctx.position==='def'||ctx.pos==='def')?'def':'atk';
      API.specialSummon(ctx.player,zone,i,pos,'魔天使ローズ・ソーサラー');
      const h=locateCardAnyV4(ctx.card);
      if(h&&h.zone==='mz') API.setCardFlag({card:ctx.card},'banishWhenLeavesField',true,'魔天使ローズ・ソーサラー',{silent:true});
    }
  }
});
})();
