/* Ritual recovery batch — 儀式召喚 primitive で解消したカード。
   儀式魔法は全て同じ形をしているので1つのファクトリで定義する。
   必要レベルと levelMode は engine/14_ritual_v5.js の RITUAL_SPEC_V5 に
   カード個別で書いてある（グローバル推測はしない）。 */

function v5DefineRitualSpell(name){
  defineUnifiedCardV4(name,[{
    key:'ritual-summon',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
    condition(ctx){return API.ritualCanActivate(ctx.player,name);},
    operation(ctx){API.ritualSummon(ctx,name);},
    afterResolve(){}
  }],{type:'spell',priority:1,includesSpecialSummon:true});
}
v5DefineRitualSpell('カオス－黒魔術の儀式');
v5DefineRitualSpell('ジャベリンビートルの契約');
v5DefineRitualSpell('スカルライダーの復活');
v5DefineRitualSpell('ゼラの儀式');
v5DefineRitualSpell('チャクラの復活');
v5DefineRitualSpell('ドリアードの祈り');
v5DefineRitualSpell('ライオンの儀式');
v5DefineRitualSpell('ローの祈り');
v5DefineRitualSpell('合成魔術');
v5DefineRitualSpell('大邪神の儀式');
v5DefineRitualSpell('奇跡の方舟');
v5DefineRitualSpell('悪魔鏡の儀式');
v5DefineRitualSpell('灼熱の試練');
v5DefineRitualSpell('白竜降臨');
v5DefineRitualSpell('要塞クジラの誓い');
v5DefineRitualSpell('覚醒の証');
/* 以下は儀式モンスター3枚を降臨させるために必要な儀式魔法 */
v5DefineRitualSpell('闇の支配者との契約');
v5DefineRitualSpell('エンド・オブ・ザ・ワールド');
v5DefineRitualSpell('リチュアの儀水鏡');

/* ---- 儀式モンスター本体の効果 ------------------------------------------ */

defineUnifiedCardV4('終焉の王デミス',[{
  key:'pay-2000-wipe-others',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).lp>2000;},
  cost(ctx,done){API.payCost(ctx.player,2000);done(true);},
  operation(ctx){
    const self=ctx.card;
    API.fieldCards({filter:x=>x.card!==self&&['mz','sz','field'].includes(x.zone)}).slice()
       .forEach(t=>API.destroy(t,'終焉の王デミス'));
  },
  afterResolve(){}
}],{type:'monster',priority:1,destroysFieldV46:true});

defineUnifiedCardV4('闇の支配者－ゾーク',[{
  key:'dice-destroy',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(){return true;},
  operation(ctx){
    const roll=(typeof duelRandomInt==='function'?duelRandomInt(6):Math.floor(Math.random()*6))+1;
    API.log('闇の支配者－ゾーク：サイコロの目は '+roll);
    if(roll<=2){
      API.fieldCards({player:ctx.opponent,zone:'mz'}).slice().forEach(t=>API.destroy(t,'闇の支配者－ゾーク'));
    }else if(roll<=5){
      const pool=API.fieldCards({player:ctx.opponent,zone:'mz'});
      if(pool.length) API.requestChoice({player:ctx.player,kind:'card',title:'闇の支配者－ゾーク：破壊するモンスター',
        candidates:pool,min:1,max:1,cancelable:true,
        resume:{handler:'s03u62.zork-dice-destroy',args:{}},
        meta:{scriptName:'闇の支配者－ゾーク'}});
    }else{
      API.fieldCards({player:ctx.player,zone:'mz'}).slice().forEach(t=>API.destroy(t,'闇の支配者－ゾーク'));
    }
  },
  afterResolve(){}
}],{type:'monster',priority:1,destroysFieldV46:true});
/* S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.zork-dice-destroy',(answer)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(h)API.destroy(h,'闇の支配者－ゾーク');
});

defineUnifiedCardV4('イビリチュア・ソウルオーガ',[{
  key:'discard-gishki-bounce-to-deck',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){
    return API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.GISHKI)).length>0
        && API.fieldCards({player:ctx.opponent,filter:x=>x.card.face==='up'}).length>0;
  },
  cost(ctx,done){
    const pool=API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.GISHKI));
    if(!pool.length){done(false);return;}
    API.selectCard('イビリチュア・ソウルオーガ：捨てる「リチュア」',pool,t=>{
      const h=resolveTarget(t);
      if(!h){done(false);return;}
      API.discard(ctx.player,h.index,'イビリチュア・ソウルオーガ（コスト）',{byEffect:true,byPlayer:ctx.player});
      done(true);
    });
  },
  target(ctx,done){
    API.selectCard('イビリチュア・ソウルオーガ：デッキに戻すカード',
      API.fieldCards({player:ctx.opponent,filter:x=>x.card.face==='up'}),t=>done([t]));
  },
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(t) API.returnToDeck(t,false,'イビリチュア・ソウルオーガ');
  },
  afterResolve(){}
}],{type:'monster',priority:1,targets:true});

