/* P4 SetcodeAuthority recovery mini-batch — 13 metadata-only ENGINE_GAP cards. */
function p4rFaceMonsters(player,group){
  return API.fieldCards({player,zone:'mz',filter:x=>x.card.face==='up'&&x.db.k==='m'&&isCardInGroupV4(x.db,group)});
}
API.registerChoiceHandler('p4recovery.fortissimo-summon',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0],h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.p===args.player&&h.zone==='hand'&&hasMonsterZoneSpace(args.player)){
    API.specialSummon(args.player,'hand',h.index,'atk',args.reason);
    const source=findCardByUid(args.sourceUid);
    if(source&&source.p===args.player&&source.zone==='field')API.setCardFlag(source,'p4rFortissimoTurn',gameState.turn,args.reason);
  }
});
API.registerChoiceHandler('p4recovery.morphtronic-speed',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0],h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.p===args.player&&h.zone==='hand'&&dbOf(h.card).k==='m'&&isCardInGroupV4(dbOf(h.card),GROUP.D_MORPHTRONIC)){
    API.returnToDeck(h,false,args.reason);
    API.shuffle(args.player);
    const target=findCardByUid(args.targetUid);
    if(target){API.destroy(target,args.reason);API.draw(args.player,1);}
  }
  v49P1FinishSource(args);
});

defineUnifiedCardV4('スペーシア・ギフト',[{
  key:'draw-neospacian-kinds',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return p4rFaceMonsters(ctx.player,GROUP.N_NEOSPACIAN).length>0&&API.me(ctx).deck.length>0;},
  operation(ctx){const kinds=new Set(p4rFaceMonsters(ctx.player,GROUP.N_NEOSPACIAN).map(x=>canonicalCardCodeV4(x.db)));API.draw(ctx.player,Math.min(kinds.size,API.me(ctx).deck.length));},afterResolve(){}
}],{type:'spell',priority:1});

defineUnifiedCardV4('バスター・テレポート',[{
  key:'return-assault-draw-two',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).deck.length>=2&&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.ASSAULT_MODE)).length>0;},
  cost(ctx,done){API.selectCard('バスター・テレポート：デッキへ戻す／バスター',API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.ASSAULT_MODE)),t=>{const h=resolveTarget(t);if(h)API.returnToDeck(h,false,'バスター・テレポート（コスト）');API.shuffle(ctx.player);done(!!h);});},
  operation(ctx){API.draw(ctx.player,2);},afterResolve(){}
}],{type:'spell',priority:1});

defineUnifiedCardV4('バスター・バースト',[{
  key:'tribute-assault-burn-both',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return p4rFaceMonsters(ctx.player,GROUP.ASSAULT_MODE).length>0;},
  cost(ctx,done){API.selectCard('バスター・バースト：リリースする／バスター',p4rFaceMonsters(ctx.player,GROUP.ASSAULT_MODE),t=>{const h=resolveTarget(t),source=locateCardAnyV4(ctx.card);if(h&&source){API.setCardFlag(source,'p4rBurstLevel',dbOf(h.card).lv||0,'バスター・バースト');API.sendToGrave(h,'バスター・バースト（リリース）');}done(!!h&&!!source);});},
  operation(ctx){const n=Math.max(0,Number(ctx.card.p4rBurstLevel)||0)*200;if(n){API.damageLP(ctx.player,n);API.damageLP(ctx.opponent,n);}const source=locateCardAnyV4(ctx.card);if(source)API.setCardFlag(source,'p4rBurstLevel',null,'バスター・バースト');},afterResolve(){}
}],{type:'spell',priority:2});

defineUnifiedCardV4('バスター・スラッシュ',[{
  key:'wipe-faceup-monsters',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return p4rFaceMonsters(ctx.player,GROUP.ASSAULT_MODE).length>0;},
  operation(){API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}).slice().forEach(t=>API.destroy(t,'バスター・スラッシュ'));},afterResolve(){}
}],{type:'trap',priority:2,destroysFieldV46:true});

defineUnifiedCardV4('機動要塞フォルテシモ',[
  {key:'activate-field',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.FIELD,speed:1,events:['activate'],operation(){},afterResolve(){}},
  {key:'summon-meklord-army',type:EFFECT_TYPE.IGNITION,range:LOCATION.FIELD,speed:1,events:['activate'],
   condition(ctx){return ctx.card.face==='up'&&ctx.card.p4rFortissimoTurn!==gameState.turn&&hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.MEKLORD_ARMY)).length>0;},
   operation(ctx){ensureCardUid(gameState,ctx.card);v49P1Open(ctx,{kind:'card',title:'機動要塞フォルテシモ：特殊召喚する機皇兵',candidates:API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.MEKLORD_ARMY)),min:1,max:1},'p4recovery.fortissimo-summon',{sourceUid:ctx.card.uid},false);},afterResolve(){}}
],{type:'spell',priority:1,timing:['mainPhase'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true,continuous:{scope:'self',from:['field'],apply(){return null;}}});

defineUnifiedCardV4('機限爆弾',[{
  key:'destroy-meklord-and-opponent',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetSide:'both',speed:2,events:['activate'],
  condition(ctx){return p4rFaceMonsters(ctx.player,GROUP.MEKLORD).length>0&&API.fieldCards({player:ctx.opponent}).length>0;},
  target(ctx,done){API.selectCard('機限爆弾：自分の機皇',p4rFaceMonsters(ctx.player,GROUP.MEKLORD),a=>API.selectCard('機限爆弾：相手フィールドのカード',API.fieldCards({player:ctx.opponent}),b=>done([a,b])));},
  operation(ctx){for(const t of ctx.selectedTargets||[]){const h=resolveTarget(t);if(h)API.destroy(h,'機限爆弾');}},afterResolve(){}
}],{type:'trap',priority:2,targets:true,destroysFieldV46:true});

defineUnifiedCardV4('D・ゲイザー',[{
  key:'morphtronic-to-defense',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onNormalSummon','onFlip','onSpecialSummon'],
  condition(ctx){const e=ctx.event||{},d=e.card&&dbOf(e.card);return !!(d&&d.k==='m'&&isCardInGroupV4(d,GROUP.D_MORPHTRONIC));},
  operation(ctx){const h=ctx.event&&ctx.event.card&&locateCardAnyV4(ctx.event.card);if(h){if(h.card.face==='down')API.flip(h,'up','D・ゲイザー');const r=locateCardAnyV4(h.card);if(r)API.changePosition(r,'def','D・ゲイザー');}},afterResolve(){}
}],{type:'trap',priority:2,continuous:{scope:'self',from:['sz'],apply(){return null;}},passive:{onNormalSummon:()=>true,onFlip:()=>true,onSpecialSummon:()=>true}});

defineUnifiedCardV4('D・スピードユニット',[{
  key:'return-morphtronic-destroy-draw',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).deck.length>0&&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.D_MORPHTRONIC)).length>0&&API.fieldCards({}).length>0;},
  target(ctx,done){API.selectCard('D・スピードユニット：破壊するカード',API.fieldCards({}),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(!t)return;ensureCardUid(gameState,t.card);v49P1Open(ctx,{kind:'card',title:'D・スピードユニット：デッキへ戻すD',candidates:API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.D_MORPHTRONIC)),min:1,max:1},'p4recovery.morphtronic-speed',{targetUid:t.card.uid},true);},afterResolve(){}
}],{type:'spell',priority:1,targets:true,destroysFieldV46:true});

defineUnifiedCardV4('Sin Claw Stream',[{
  key:'destroy-opponent-monster',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:2,events:['activate'],
  condition(ctx){return p4rFaceMonsters(ctx.player,GROUP.SIN).length>0&&API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;},
  target(ctx,done){API.selectCard('Sin Claw Stream：破壊する相手モンスター',API.fieldCards({player:ctx.opponent,zone:'mz'}),t=>done([t]));},
  operation(ctx){const h=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(h)API.destroy(h,'Sin Claw Stream');},afterResolve(){}
}],{type:'trap',priority:2,targets:true,destroysFieldV46:true});

defineUnifiedCardV4('地縛旋風',[{
  key:'wipe-opponent-spell-trap',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return p4rFaceMonsters(ctx.player,GROUP.EARTHBOUND).length>0&&API.fieldCards({player:ctx.opponent,filter:x=>['sz','field'].includes(x.zone)}).length>0;},
  operation(ctx){API.fieldCards({player:ctx.opponent,filter:x=>['sz','field'].includes(x.zone)}).slice().forEach(t=>API.destroy(t,'地縛旋風'));},afterResolve(){}
}],{type:'spell',priority:1,destroysFieldV46:true});

defineUnifiedCardV4('スーパーチャージ',[{
  key:'attack-draw-two',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onAttackDeclare'],
  condition(ctx){const a=gameState.pendingAttack,own=API.fieldCards({player:ctx.player,zone:'mz'});return !!(a&&a.player===ctx.opponent&&API.me(ctx).deck.length>=2&&own.length===1&&own[0].card.face==='up'&&own[0].db.k==='m'&&own[0].db.ra==='機械'&&isCardInGroupV4(own[0].db,GROUP.ROID));},
  operation(ctx){API.draw(ctx.player,2);},afterResolve(){}
}],{type:'trap',priority:2,passive:{onAttackDeclare:()=>true}});

defineUnifiedCardV4('レプティレス・ポイズン',[{
  key:'force-attack-zero',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['activate'],
  condition(ctx){return p4rFaceMonsters(ctx.player,GROUP.REPTILIANNE).length>0&&API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.pos==='def'}).length>0;},
  target(ctx,done){API.selectCard('レプティレス・ポイズン：攻撃表示にする相手',API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.pos==='def'}),t=>done([t]));},
  operation(ctx){let h=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(!h)return;if(h.card.face==='down')API.flip(h,'up','レプティレス・ポイズン');h=locateCardAnyV4(h.card);if(!h)return;API.changePosition(h,'atk','レプティレス・ポイズン');h=locateCardAnyV4(h.card);if(h)v4RegisterStatModifier(h,{setAtk:0},{code:'レプティレス・ポイズン',resetMask:RESET.LEAVE|RESET.FACE_DOWN});},afterResolve(){}
}],{type:'spell',priority:1,targets:true});
