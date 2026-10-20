/* CODEX-C05 — deck-priority automation selected from the user's
   スキドレギアバレー / レヴァライダー / ガリスフルモン lists. */

/* ミンゲイドラゴン is provided by S03-U416. Keep one runtime writer. */

/* ---- 時械神メタイオン ------------------------------------------------- */
function c05MetaionDamage(info){
  const self=info.self;
  if(!self||self.face!=='up'||self.pos!=='atk')return info.amount;
  if((info.atkCard===self||info.defCard===self)&&info.to===info.srcPlayer)return 0;
  return info.amount;
}

defineUnifiedCardV4('時械神メタイオン',[{
  key:'battle-end-return',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onBattlePhaseEnd'],forced:true,
  condition(ctx){return ctx.card.face==='up'&&API.battledThisPhase(ctx.card);},
  operation(ctx){
    const others=API.fieldCards({zone:'mz',filter:x=>x.card!==ctx.card}).map(x=>x.card);
    let returned=0;
    for(const card of others){
      const h=locateCardAnyV4(card);if(!h||h.zone!=='mz')continue;
      API.returnToHand(h,'時械神メタイオン');
      const after=locateCardAnyV4(card);
      if(after&&(after.zone==='hand'||after.zone==='ex'))returned++;
    }
    if(returned)API.damageLP(ctx.opponent,returned*300);
  },afterResolve(){}
},{
  key:'standby-return',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onStandbyPhase'],forced:true,
  condition(ctx){return gameState.activePlayer===ctx.player&&ctx.card.face==='up';},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);if(!h||h.zone!=='mz')return;
    const owner=(ctx.card.owner===0||ctx.card.owner===1)?ctx.card.owner:h.p;
    API.returnToDeck(h,false,'時械神メタイオン');API.shuffle(owner);
  },afterResolve(){}
}],{
  type:'monster',priority:1,forced:true,cannotSpecialSummonFromS03:['deck'],
  normalSummonProcedure:{includeStandard:true,methods:[{
    id:'metaion0',tributes:0,modes:['summon'],summonLabel:'自分フィールドにモンスターがいないためリリースなしで召喚',
    condition({player}){return gameState.players[player].mz.length===0;}
  }]},
  passive:{
    onBattlePhaseEnd:ctx=>ctx.zone==='mz'&&ctx.card.face==='up'&&API.battledThisPhase(ctx.card),
    onStandbyPhase:ctx=>ctx.zone==='mz'&&ctx.card.face==='up'&&gameState.activePlayer===ctx.player
  },
  protectV21:{key:'c05.metaion',battle:true,effect:true,label:'時械神メタイオン'},
  continuous:{scope:'self',from:['mz'],apply(){return null;},battleDamage:c05MetaionDamage}
});

/* ---- 究極時械神セフィロン --------------------------------------------- */
function c05SephylonPool(player){
  return API.pileCards(player,'hand',x=>x.db.k==='m'&&x.db.ra==='天使'&&(x.db.lv||0)>=8&&canEffectSpecialSummonS03(x.card,'hand','究極時械神セフィロン'))
    .concat(API.pileCards(player,'grave',x=>x.db.k==='m'&&x.db.ra==='天使'&&(x.db.lv||0)>=8&&canEffectSpecialSummonS03(x.card,'grave','究極時械神セフィロン')));
}

API.registerChoiceHandler('codex.c05.sephylon-summon',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0],h=picked&&locateCardAnyV4(picked.card);
  if(!h||h.p!==args.player||!['hand','grave'].includes(h.zone)||!hasMonsterZoneSpace(args.player))return;
  const db=dbOf(h.card);
  if(db.k!=='m'||db.ra!=='天使'||(db.lv||0)<8||!canEffectSpecialSummonS03(h.card,h.zone,args.reason))return;
  ensureCardUid(gameState,h.card);const uid=h.card.uid;
  API.specialSummon(args.player,h.zone,h.index,'atk',args.reason);
  const now=findCardByUid(uid);
  if(now&&now.zone==='mz'){
    API.negateEffectUntil(now,'permanent',args.reason);
    v4RegisterStatModifier(now,{setAtk:4000},{code:'究極時械神セフィロン',resetMask:RESET.LEAVE|RESET.FACE_DOWN});
  }
});

defineUnifiedCardV4('究極時械神セフィロン',[{
  key:'summon-fairy',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return ctx.card.face==='up'&&hasMonsterZoneSpace(ctx.player)&&c05SephylonPool(ctx.player).length>0;},
  operation(ctx){
    const pool=c05SephylonPool(ctx.player);if(!pool.length)return;
    API.requestChoice({player:ctx.player,kind:'card',title:'究極時械神セフィロン：特殊召喚するレベル8以上の天使族',
      candidates:pool,min:1,max:1,cancelable:false,
      resume:{handler:'codex.c05.sephylon-summon',args:{player:ctx.player,reason:'究極時械神セフィロン'}},
      meta:{v4EffectKey:ctx.v4EffectKey||null,scriptName:'究極時械神セフィロン'}});
  },afterResolve(){}
}],{
  type:'monster',priority:1,timing:['mainPhase'],countLimit:{n:1,effects:['summon-fairy']},
  cannotNormalSummon:true,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  summonProcedure:{from:'hand',positions:['atk','def'],condition(ctx){
    const n=API.pileCards(ctx.player,'grave',x=>x.db.k==='m').length;
    if(n<10){ctx.reason='自分の墓地のモンスターが10体以上必要です';return false;}
    return hasMonsterZoneSpace(ctx.player);
  }}
});
