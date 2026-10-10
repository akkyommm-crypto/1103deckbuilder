/* Auto cycle 41 — Red-Eyes / Dragon / Dragunity safe pickups.
   No engine changes. 1103-era behavior is preferred over modern HOPT text. */

function e3Loc(card){ return locateCardAnyV4(card); }
function e3SelfEvent(ctx){ return !!(ctx.event&&ctx.event.card===ctx.card); }
function e3FaceOwn(player,pred){
  return API.fieldCards({player,zone:'mz',filter:x=>x.card.face==='up'&&(!pred||pred(x))});
}
function e3Exact(name, hOrCard){
  const db = hOrCard && (hOrCard.db || dbOf(hOrCard.card || hOrCard));
  const ref = dbOf({id:findCardIndex(name)});
  return !!(db && ref && sameCanonicalCardV4(db, ref));
}
function e3RedEyes(db){ return !!(db && isSetCardV4(db, SETCODE.RED_EYES)); }
function e3Dragon(db){ return !!(db && db.k==='m' && db.ra==='ドラゴン'); }
function e3Zombie(db){ return !!(db && db.k==='m' && db.ra==='アンデット'); }
function e3Dragunity(db){ return !!(db && isSetCardV4(db, SETCODE.DRAGUNITY)); }
function e3HasMonsterZone(player){ return hasMonsterZoneSpace(player); }
function e3Pile(player, zone, pred){ return API.pileCards(player, zone, x=>!pred||pred(x)); }
function e3MaterialSnapshots(card){ return API.materialSnapshots ? API.materialSnapshots(card) : []; }
function e3OnSelfSynchro(ctx){
  return !!(ctx.event&&ctx.event.card===ctx.card&&ctx.event.kind==='synchro');
}
function e3UpTo(title,pool,max,done){
  const picked=[];
  const step=()=>{
    const left=pool.filter(x=>picked.indexOf(x)<0);
    if(!left.length||picked.length>=max){ done(picked); return; }
    API.selectCard(title+'（'+(picked.length+1)+'/'+max+'）',left,t=>{
      picked.push(t);
      if(picked.length>=max){ done(picked); return; }
      API.confirm(title,picked.length+'枚選択しました。さらに選びますか？',step,()=>done(picked));
    });
  };
  step();
}
function e3EquippedDragunityDragon(self){
  return equipsOnV15(self,gameState).some(eq=>eq.card&&eq.card.v46MonsterEquip&&e3Dragunity(eq.db)&&eq.db.ra==='ドラゴン');
}

API.registerChoiceHandler('e3.redmd-special',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  if(!picked||!hasMonsterZoneSpace(args.player)) return;
  const h=e3Loc(picked.card);
  if(!h||h.p!==args.player||!['hand','grave'].includes(h.zone)) return;
  if(!e3Dragon(dbOf(h.card))||e3Exact('レッドアイズ・ダークネスメタルドラゴン',h)) return;
  API.specialSummon(args.player,h.zone,h.index,'atk','レッドアイズ・ダークネスメタルドラゴン');
});

defineUnifiedCardV4('レッドアイズ・ダークネスメタルドラゴン',[{
  key:'summon-dragon-from-hand-grave',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  speed:1,events:['activate'],
  condition(ctx){
    if(!e3HasMonsterZone(ctx.player)){ ctx.reason='モンスターゾーンに空きがありません'; return false; }
    return e3Pile(ctx.player,'hand',x=>e3Dragon(x.db)&&!e3Exact('レッドアイズ・ダークネスメタルドラゴン',x)).length
        + e3Pile(ctx.player,'grave',x=>e3Dragon(x.db)&&!e3Exact('レッドアイズ・ダークネスメタルドラゴン',x)).length > 0;
  },
  operation(ctx){
    const candidates=e3Pile(ctx.player,'hand',x=>e3Dragon(x.db)&&!e3Exact('レッドアイズ・ダークネスメタルドラゴン',x))
      .concat(e3Pile(ctx.player,'grave',x=>e3Dragon(x.db)&&!e3Exact('レッドアイズ・ダークネスメタルドラゴン',x)));
    v49P1Open(ctx,{kind:'card',title:'レッドアイズ・ダークネスメタルドラゴン：特殊召喚するドラゴン族',
      candidates,min:1,max:1},'e3.redmd-special',{},false);
  },
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  summonProcedure:{from:'hand',positions:['atk','def'],
    condition(ctx){
      return e3HasMonsterZone(ctx.player)
        && e3FaceOwn(ctx.player,x=>x.card!==ctx.card&&e3Dragon(x.db)).length>0;
    },
    cost(ctx,done){
      API.selectCard('レッドアイズ・ダークネスメタルドラゴン：除外する表側ドラゴン族',
        e3FaceOwn(ctx.player,x=>x.card!==ctx.card&&e3Dragon(x.db)),t=>{
          const h=resolveTarget(t); if(!h){ done(false); return; }
          API.banish(h,'レッドアイズ・ダークネスメタルドラゴン（特殊召喚手順）');
          done(true);
        });
    }}
});

defineUnifiedCardV4('真紅眼の飛竜',[{
  key:'end-revive-red-eyes',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,
  targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['onEndPhase'],
  condition(ctx){
    if(ctx.zone!=='grave'||gameState.activePlayer!==ctx.player||gameState.players[ctx.player].normalSummonUsed){
      ctx.reason='通常召喚していない自分エンドフェイズに墓地で発動します'; return false;
    }
    if(!e3HasMonsterZone(ctx.player)){ ctx.reason='モンスターゾーンに空きがありません'; return false; }
    return e3Pile(ctx.player,'grave',x=>x.card!==ctx.card&&e3RedEyes(x.db)).length>0;
  },
  cost(ctx,done){ const h=e3Loc(ctx.card); if(h&&h.zone==='grave')API.banish(h,'真紅眼の飛竜（コスト）'); done(!!h); },
  target(ctx,done){ API.selectCard('真紅眼の飛竜：特殊召喚するレッドアイズ',e3Pile(ctx.player,'grave',x=>x.card!==ctx.card&&e3RedEyes(x.db)),t=>done([t])); },
  operation(ctx){ const h=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]); if(h&&h.zone==='grave')API.specialSummon(ctx.player,'grave',h.index,'atk','真紅眼の飛竜'); },
  afterResolve(){}
}],{type:'monster',priority:1,activateFrom:['grave'],targets:true,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  passive:{onEndPhase:ctx=>ctx.zone==='grave'}});

defineUnifiedCardV4('黒炎弾',[{
  key:'red-eyes-burn',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){
    return e3FaceOwn(ctx.player,x=>e3Exact('真紅眼の黒竜',x)).length>0;
  },
  target(ctx,done){ API.selectCard('黒炎弾：対象の真紅眼の黒竜',e3FaceOwn(ctx.player,x=>e3Exact('真紅眼の黒竜',x)),t=>done([t])); },
  operation(ctx){
    const h=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!h||!e3Exact('真紅眼の黒竜',h)) return;
    API.damageLP(ctx.opponent,Math.max(0,Number(dbOf(h.card).atk)||0));
    API.setCardFlag(h,'cannotAttack',true,'黒炎弾');
  },
  afterResolve(){}
}],{type:'spell',priority:1,targets:true});

defineUnifiedCardV4('デスカイザー・ドラゴン',[{
  key:'synchro-revive-foe-zombie',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  targetRange:LOCATION.GRAVE,targetSide:'opponent',speed:1,events:['onSpecialSummon'],
  condition(ctx){
    if(!e3OnSelfSynchro(ctx)){ ctx.reason='このカードのS召喚成功時に発動します'; return false; }
    if(!e3HasMonsterZone(ctx.player)){ ctx.reason='モンスターゾーンに空きがありません'; return false; }
    return e3Pile(ctx.opponent,'grave',x=>e3Zombie(x.db)).length>0;
  },
  target(ctx,done){ API.selectCard('デスカイザー・ドラゴン：特殊召喚する相手墓地のアンデット族',e3Pile(ctx.opponent,'grave',x=>e3Zombie(x.db)),t=>done([t])); },
  operation(ctx){
    const r=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    const self=e3Loc(ctx.card);
    if(!r||r.zone!=='grave'||!self||!e3HasMonsterZone(ctx.player)) return;
    const card=r.card;
    API.specialSummon(ctx.player,'grave',r.index,'atk','デスカイザー・ドラゴン',r.p);
    const now=e3Loc(card);
    if(now&&now.zone==='mz') API.linkOnLeave(now,self,'destroy','デスカイザー・ドラゴン');
  },
  afterResolve(){}
}],{type:'synchro',priority:1,targets:true,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  passive:{onSpecialSummon:ctx=>e3OnSelfSynchro(ctx)}});

defineUnifiedCardV4('ドラグニティ－アングス',[],{type:'monster',priority:1,
  continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage(info){
    if(info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def') return 0;
    if(!e3EquippedDragunityDragon(info.self)) return 0;
    return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
  }}
});

defineUnifiedCardV4('トライデント・ドラギオン',[{
  key:'synchro-destroy-extra-attacks',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  targetRange:LOCATION.ONFIELD,targetSide:'self',speed:1,events:['onSpecialSummon'],
  condition(ctx){
    if(!e3OnSelfSynchro(ctx)){ ctx.reason='このカードのS召喚成功時に発動します'; return false; }
    return API.fieldCards({player:ctx.player,filter:x=>x.card!==ctx.card}).length>0;
  },
  target(ctx,done){ e3UpTo('トライデント・ドラギオン：破壊する自分のカード',API.fieldCards({player:ctx.player,filter:x=>x.card!==ctx.card}),2,done); },
  operation(ctx){
    const self=e3Loc(ctx.card); if(!self) return;
    let n=0;
    (ctx.selectedTargets||[]).slice().reverse().forEach(t=>{
      const h=resolveTarget(t); if(!h) return;
      const uid=h.card.uid; API.destroy(h,'トライデント・ドラギオン');
      const after=findCardByUid(uid);
      if(!after||!['mz','sz','field'].includes(after.zone)) n++;
    });
    if(n>0) API.grantAdditionalAttack(self,n,'トライデント・ドラギオン',false);
  },
  afterResolve(){}
}],{type:'synchro',priority:1,targets:true,destroysFieldV46:true,
  passive:{onSpecialSummon:ctx=>e3OnSelfSynchro(ctx)}});

defineUnifiedCardV4('ストロング・ウィンド・ドラゴン',[{
  key:'dragon-tribute-gain',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onNormalSummon'],
  condition(ctx){
    if(!e3SelfEvent(ctx)) return false;
    const ms=e3MaterialSnapshots(ctx.card);
    return ms.length===1&&ms[0].race==='ドラゴン'&&ms[0].originalAtk!=null;
  },
  operation(ctx){
    const h=e3Loc(ctx.card), ms=e3MaterialSnapshots(ctx.card);
    if(h&&ms.length===1&&ms[0].originalAtk!=null) API.modAtk(h,Math.floor(Math.max(0,ms[0].originalAtk)/2),0,'permanent','ストロング・ウィンド・ドラゴン');
  },
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,battleProof:false,
  passive:{onNormalSummon:ctx=>e3SelfEvent(ctx)},
  continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage(info){
    if(info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def') return 0;
    return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
  }},
  protectV21:{key:'e3.equal-atk',battle:(target,src,ctx)=>ctx&&ctx.opponentCard&&curATK(target)===curATK(ctx.opponentCard),label:'ストロング・ウィンド・ドラゴン'}
});
