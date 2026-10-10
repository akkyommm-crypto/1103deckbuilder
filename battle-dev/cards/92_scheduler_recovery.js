/* Scheduler recovery batch — System v7 Delayed/Scheduled primitive で解消したカード。
   使う共通APIは schedule / cancelSchedule / schedules / scheduleSourceAlive /
   skipPhase / skipOwnPhase / phaseSkipped / clearModsByLabel と、
   既存の modAtk / destroy / draw / discard / specialSummon のみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* ---- 予約ハンドラ（closure を state に置かないため名前で登録する） ---- */
API.registerScheduleHandler('v7.destroyUid',(args)=>{
  const h=(args.uid!=null)?findCardByUid(args.uid):null;
  if(h&&h.zone==='mz') API.destroy(h,args.reason||'エンドフェイズの破壊');
});
API.registerScheduleHandler('v7.faceDownDefUid',(args)=>{
  const h=(args.uid!=null)?findCardByUid(args.uid):null;
  if(h&&h.zone==='mz')
    act({type:'FX_SET_STATE',player:h.p,zone:'mz',index:h.index,face:'down',pos:'def',reason:args.reason||'効果'});
});
API.registerScheduleHandler('v7.clearModLabel',(args)=>{
  const h=(args.uid!=null)?findCardByUid(args.uid):null;
  if(h) API.clearModsByLabel(h,args.label);
});
API.registerScheduleHandler('v7.discardHand',(args)=>{
  const P=gameState.players[args.player];
  for(let i=(P.hand||[]).length-1;i>=0;i--)
    API.discard(args.player,i,args.reason||'効果',{byEffect:true,byPlayer:args.player});
});
API.registerScheduleHandler('v7.drawIf',(args)=>{
  /* フラグが立っているときだけドローする（発動ターン中の条件を後から見る） */
  if(args.flag && !API.getFlag(args.player,args.flag)) return;
  for(let i=0;i<(args.n||1)&&gameState.players[args.player].deck.length;i++) API.draw(args.player,1);
  if(args.flag) API.setFlag(args.player,args.flag,null,true);
});
API.registerScheduleHandler('v7.setPlayerFlag',(args)=>{
  API.setFlag(args.player,args.key,args.value,true);
});

/* 自分フィールドの表側モンスター */
function v7OwnFaceUp(ctx,f){
  return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&x.db.k==='m'&&(!f||f(x))});
}

/* ---- フェイズのスキップ ------------------------------------------------ */
defineUnifiedCardV4('ソロモンの律法書',[{
  key:'skip-own-standby',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(){return true;},
  operation(ctx){API.skipOwnPhase(ctx.player,'standby');},afterResolve(){}
}],{type:'trap',priority:2});

defineUnifiedCardV4('刻の封印',[{
  key:'skip-opponent-draw',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(){return true;},
  /* 「次の相手ターンのドローフェイズ」= 相手から見た次の自分のターン */
  operation(ctx){API.skipOwnPhase(ctx.opponent,'draw');},afterResolve(){}
}],{type:'trap',priority:2});

defineUnifiedCardV4('死者への供物',[{
  key:'destroy-then-skip-draw',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:2,events:['activate'],
  condition(){return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
  target(ctx,done){API.selectCard('死者への供物：破壊するモンスター',
    API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(t)API.destroy(t,'死者への供物');
    API.skipOwnPhase(ctx.player,'draw');
  },afterResolve(){}
}],{type:'spell',priority:2,targets:true,destroysFieldV46:true});

defineUnifiedCardV4('無謀な欲張り',[{
  key:'draw-two-skip-two-draws',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return API.me(ctx).deck.length>=2;},
  operation(ctx){
    API.draw(ctx.player,2);
    /* 「その後の自分ドローフェイズは2回スキップされる」= 次の自分のターンと
       その次の自分のターン。同じターンに2件積むのではなく別ターンへ積む。 */
    const own=(gameState.activePlayer===ctx.player)?2:1;
    API.skipPhase(ctx.player,'draw',own);
    API.skipPhase(ctx.player,'draw',own+2);
  },afterResolve(){}
}],{type:'trap',priority:2});

/* ---- エンドフェイズへの予約 -------------------------------------------- */
defineUnifiedCardV4('無の煉獄',[{
  key:'draw-then-discard-hand-at-end',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).hand.length>=3&&API.me(ctx).deck.length>0;},
  operation(ctx){
    API.draw(ctx.player,1);
    API.schedule({at:'endPhase',turns:0,player:ctx.player,
      handler:'v7.discardHand',args:{player:ctx.player,reason:'無の煉獄'},note:'無の煉獄'});
  },afterResolve(){}
}],{type:'spell',priority:1});

defineUnifiedCardV4('野性解放',[{
  key:'beast-atk-up-destroy-at-end',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(){return API.fieldCards({zone:'mz',
    filter:x=>x.card.face==='up'&&x.db.k==='m'&&(x.db.ra==='獣'||x.db.ra==='獣戦士')}).length>0;},
  target(ctx,done){API.selectCard('野性解放：対象の獣族・獣戦士族',
    API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&x.db.k==='m'&&(x.db.ra==='獣'||x.db.ra==='獣戦士')}),
    t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!t||!t.card) return;
    API.modAtk(t,API.curDef(t),0,'permanent','野性解放');
    ensureCardUid(gameState,t.card);
    API.schedule({at:'endPhase',turns:0,player:ctx.player,
      handler:'v7.destroyUid',args:{uid:t.card.uid,reason:'野性解放'},note:'野性解放'});
  },afterResolve(){}
}],{type:'spell',priority:1,targets:true,destroysFieldV46:true});

defineUnifiedCardV4('フォース・リリース',[{
  key:'dual-reload-then-facedown',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return v7OwnFaceUp(ctx,x=>(x.db.st||[]).includes('デュアル')).length>0;},
  operation(ctx){
    v7OwnFaceUp(ctx,x=>(x.db.st||[]).includes('デュアル')).forEach(t=>{
      if(!t.card) return;
      ensureCardUid(gameState,t.card);
      API.setCardFlag(t,'dualUp',true,'フォース・リリース');
      API.schedule({at:'endPhase',turns:0,player:ctx.player,
        handler:'v7.faceDownDefUid',args:{uid:t.card.uid,reason:'フォース・リリース'},note:'フォース・リリース'});
    });
  },afterResolve(){}
}],{type:'spell',priority:2});

defineUnifiedCardV4('メサイアの蟻地獄',[{
  key:'schedule-destroy-low-level-summon',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,
  events:['onNormalSummon','onSpecialSummon','onFlip'],
  condition(ctx){const c=ctx.event&&ctx.event.card;
    return !!c&&(dbOf(c).lv||99)<=3&&(dbOf(c).k==='m');},
  operation(ctx){
    const c=ctx.event&&ctx.event.card; if(!c) return;
    ensureCardUid(gameState,c);
    API.schedule({at:'endPhase',turns:0,handler:'v7.destroyUid',
      args:{uid:c.uid,reason:'メサイアの蟻地獄'},note:'メサイアの蟻地獄'});
  },afterResolve(){}
}],{type:'trap',priority:1,forced:true,destroysFieldV46:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onNormalSummon:ctx=>{const c=ctx.event&&ctx.event.card;
               return !!c&&dbOf(c).k==='m'&&(dbOf(c).lv||99)<=3;},
             onSpecialSummon:ctx=>{const c=ctx.event&&ctx.event.card;
               return !!c&&dbOf(c).k==='m'&&(dbOf(c).lv||99)<=3;},
             onFlip:ctx=>{const c=ctx.event&&ctx.event.card;
               return !!c&&dbOf(c).k==='m'&&(dbOf(c).lv||99)<=3;}}});

defineUnifiedCardV4('宝札雲',[{
  key:'cloudian-double-summon-draw',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).deck.length>=2;},
  operation(ctx){
    API.setFlag(ctx.player,'v7CloudianCount',0,true);
    API.schedule({at:'endPhase',turns:0,player:ctx.player,handler:'v7.drawIf',
      args:{player:ctx.player,n:2,flag:'v7CloudianReady'},note:'宝札雲'});
  },afterResolve(){}
},{
  key:'count-cloudian-summons',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,
  events:['onNormalSummon','onSpecialSummon','onFlip'],
  condition(ctx){const c=ctx.event&&ctx.event.card;
    return !!c&&isCardInGroupV4(dbOf(c),GROUP.CLOUDIAN)
      &&API.getFlag(ctx.player,'v7CloudianCount')!=null;},
  operation(ctx){
    const c=ctx.event&&ctx.event.card; if(!c) return;
    const n=(Number(API.getFlag(ctx.player,'v7CloudianCount'))||0)+1;
    API.setFlag(ctx.player,'v7CloudianCount',n,true);
    if(n>=2) API.setFlag(ctx.player,'v7CloudianReady',true,true);
  },afterResolve(){}
}],{type:'spell',priority:1,forced:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onNormalSummon:ctx=>{const c=ctx.event&&ctx.event.card;
               return !!c&&isCardInGroupV4(dbOf(c),GROUP.CLOUDIAN);},
             onSpecialSummon:ctx=>{const c=ctx.event&&ctx.event.card;
               return !!c&&isCardInGroupV4(dbOf(c),GROUP.CLOUDIAN);},
             onFlip:ctx=>{const c=ctx.event&&ctx.event.card;
               return !!c&&isCardInGroupV4(dbOf(c),GROUP.CLOUDIAN);}}});

/* ---- ターンをまたぐ期限 ------------------------------------------------- */
defineUnifiedCardV4('破天荒な風',[{
  key:'boost-until-own-standby',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){return v7OwnFaceUp(ctx).length>0;},
  target(ctx,done){API.selectCard('破天荒な風：対象のモンスター',v7OwnFaceUp(ctx),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!t||!t.card) return;
    ensureCardUid(gameState,t.card);
    API.modAtk(t,1000,1000,'permanent','破天荒な風');
    /* 「次の自分のスタンバイフェイズ時まで」= 期限をスケジューラが持つ */
    API.schedule({at:'standbyPhase',ownTurn:true,player:ctx.player,handler:'v7.clearModLabel',
      args:{uid:t.card.uid,label:'破天荒な風'},note:'破天荒な風'});
  },afterResolve(){}
}],{type:'spell',priority:1,targets:true});

defineUnifiedCardV4('運命のドラ',[{
  key:'mark-level-for-next-own-turn',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'opponent',speed:2,events:['activate'],
  condition(ctx){return gameState.activePlayer===ctx.opponent
    &&API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
  target(ctx,done){API.selectCard('運命のドラ：対象の相手モンスター',
    API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'}),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!t||!t.card) return;
    /* 次の自分のターンの開始時にレベルを覚えさせる。数値だけを持つ純JSON。 */
    API.schedule({at:'turnStart',ownTurn:true,player:ctx.player,handler:'v7.setPlayerFlag',
      args:{player:ctx.player,key:'v7DoraLevel',value:curLV(t.card)},note:'運命のドラ'});
  },afterResolve(){}
},{
  key:'dora-damage-on-summon',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onNormalSummon'],
  condition(ctx){
    const lv=Number(API.getFlag(ctx.player,'v7DoraLevel'));
    const c=ctx.event&&ctx.event.card;
    return !!lv&&!!c&&curLV(c)===lv-1;},
  operation(ctx){
    const lv=Number(API.getFlag(ctx.player,'v7DoraLevel'))||0;
    API.damageLP(ctx.opponent,lv*500);
    API.setFlag(ctx.player,'v7DoraLevel',null,true);
  },afterResolve(){}
}],{type:'trap',priority:2,targets:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onNormalSummon:ctx=>{
      const lv=Number(API.getFlag(ctx.player,'v7DoraLevel'));
      const c=ctx.event&&ctx.event.card;
      return !!lv&&!!c&&curLV(c)===lv-1;}}});
