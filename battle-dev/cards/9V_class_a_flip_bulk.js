/* Class A bulk 50 — batch 1 / リバース効果 10枚。
   engine は触らない。既存の onFlip + v49 P1 ChoiceRequest + v20 Reveal/AtomicDeck +
   v18 LPChange + v7 Scheduler だけで書く。
   カード登録の第1引数は必ず文字列リテラル。ループ登録はしない。 */

/* 自身が表側でモンスターゾーンにいるか（リバース効果の共通条件） */
function cbFlipSelf(ctx){
  const h=locateCardAnyV4(ctx.card);
  return !!h && h.zone==='mz' && h.card.face==='up';
}
/* フィールドの全モンスター */
function cbAllMonsters(){ return API.fieldCards({zone:'mz'}); }
/* 表側表示のモンスター */
function cbFaceUpMonsters(){ return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}); }
/* フィールドの罠、またはセットされた魔法・罠（裏側は中身を見ずに候補へ入れる） */
function cbTrapOrSet(){
  const out=[];
  API.fieldCards({zone:'sz'}).forEach(h=>{
    if(h.card.face==='down') out.push(h);
    else if((h.db||dbOf(h.card)).k==='t') out.push(h);
  });
  return out;
}
/* セットされていれば公開してから、種類が合っていれば破壊する（青い忍者と同じ作法） */
function cbRevealThenDestroy(h, wantKind, name, jpKind){
  if(!h||!h.card) return;
  if(h.card.face==='down')
    API.reveal({player:h.p,audience:'both',cards:[h],label:name,until:'resolution'});
  if((h.db||dbOf(h.card)).k===wantKind) API.destroy(h,name);
  else API.log(name+'：'+jpKind+'カードではなかったので元に戻す');
}

/* ---- 継続の登録 --------------------------------------------------------- */
/* 選んだモンスターを持ち主の手札へ戻す */
API.registerChoiceHandler('cbflip.return-hand',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    const h=locateCardAnyV4(picked.card);
    if(h&&h.zone==='mz') API.returnToHand(h,args.reason);
  }
});
/* デッキの上から2枚見て1枚を手札、残りをデッキの一番下へ */
API.registerChoiceHandler('cbflip.peek-take-rest-bottom',(answer,args)=>{
  const take=v49P1ChoiceCards(answer)[0];
  const takeUid=take&&take.card?take.card.uid:null;
  if(takeUid!=null){
    const h=findCardByUid(takeUid);
    /* S03-U04: args.lockToGrave のカードは、《ライオウ》適用中なら選んだカードを墓地へ送る（09/03/02 wiki）。 */
    if(h&&h.p===args.player&&h.zone==='deck'){
      if(args.lockToGrave&&deckToHandLockReasonV32(args.player)) API.sendToGrave(h,args.reason+'（手札に加えられない）');
      else API.searchDeck(args.player,h.index,args.reason);
    }
  }
  const rest=(args.uids||[]).filter(u=>u!==takeUid);
  if(rest.length) API.orderToDeck(args.player,rest,true,args.reason);
});
/* デッキから選んだ1枚をデッキの一番上へ置く（条件が揃えば手札へ） */
API.registerChoiceHandler('cbflip.deck-to-top-or-hand',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(!h||h.p!==args.player||h.zone!=='deck') return;
  if(args.toHand===true) API.searchDeck(args.player,h.index,args.reason);
  else API.orderToDeck(args.player,[h.card.uid],false,args.reason);
});

/* ===== 1. 派手ハネ — リバース:フィールドのモンスターを3体まで手札に戻す（任意） ===== */
defineUnifiedCardV4('派手ハネ',[{
  key:'flip-bounce-up-to-three', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['onFlip'],
  condition(ctx){ return cbFlipSelf(ctx) && cbAllMonsters().length>0; },
  operation(ctx){
    const pool=cbAllMonsters();
    if(!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'派手ハネ：持ち主の手札に戻すモンスター（3体まで）',
      candidates:pool,min:0,max:Math.min(3,pool.length)},
      'cbflip.return-hand',{reason:'派手ハネ'},false);},
  afterResolve(){}
}],{type:'monster', priority:1, passive:{onFlip(ctx){ return ctx.zone==='mz'; }}});

/* ===== 2. 尾も白い黒猫 — リバース:相手2体と自分1体を手札に戻す（強制） ===== */
defineUnifiedCardV4('尾も白い黒猫',[{
  key:'flip-bounce-two-one', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['onFlip'],
  condition(ctx){
    if(!cbFlipSelf(ctx)) return false;
    return API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0
        || API.fieldCards({player:ctx.player,zone:'mz'}).length>0;},
  operation(ctx){
    /* S03-U62: 元の実装は自分側の選択に legacy API.selectCard を使っており、しかも相手側の
       v49P1Open による選択待ちと同一の同期呼び出し内で連続発行していた（後発の selectCard が
       先発の選択待ちを黙って上書きしてしまう — マッド・リローダーと同じ事故的な重複発行）。
       自分側 → 相手側の順で1つずつ逐次発行するよう書き直す。 */
    const mine=API.fieldCards({player:ctx.player,zone:'mz'});
    if(!mine.length){ tailWhiteCatOpenFoeStep(ctx.player,ctx.opponent); return; }
    if(mine.length===1){
      API.returnToHand(mine[0],'尾も白い黒猫');
      tailWhiteCatOpenFoeStep(ctx.player,ctx.opponent);
      return;
    }
    API.requestChoice({player:ctx.player,kind:'card',title:'尾も白い黒猫：手札に戻す自分のモンスター',
      candidates:mine,min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.tail-white-cat-self-bounce',args:{player:ctx.player,opponent:ctx.opponent}},
      meta:{scriptName:'尾も白い黒猫'}});
  },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, passive:{onFlip(ctx){ return ctx.zone==='mz'; }}});
function tailWhiteCatOpenFoeStep(player,opponent){
  const foe=API.fieldCards({player:opponent,zone:'mz'});
  if(!foe.length) return;
  API.requestChoice({player,kind:'card',title:'尾も白い黒猫：手札に戻す相手モンスター（2体まで）',
    candidates:foe,min:Math.min(2,foe.length),max:Math.min(2,foe.length),cancelable:false,
    resume:{handler:'cbflip.return-hand',args:{reason:'尾も白い黒猫'}},
    meta:{scriptName:'尾も白い黒猫'}});
}
API.registerChoiceHandler('s03u62.tail-white-cat-self-bounce',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(h)API.returnToHand(h,'尾も白い黒猫');
  tailWhiteCatOpenFoeStep(args.player,args.opponent);
});

/* ===== 3. 水晶の占い師 — リバース:デッキ上2枚から1枚を手札、残りをデッキの一番下 ===== */
defineUnifiedCardV4('水晶の占い師',[{
  key:'flip-peek-two', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onFlip'],
  condition(ctx){ return cbFlipSelf(ctx) && API.me(ctx).deck.length>0; },
  operation(ctx){
    const top=API.deckTop(ctx.player,2);
    if(!top.length) return;
    top.forEach(x=>{ if(x&&x.card) ensureCardUid(gameState,x.card); });
    API.reveal({player:ctx.player,audience:'self',cards:top,label:'水晶の占い師',until:'resolution'});
    if(top.length===1){
      if(deckToHandLockReasonV32(ctx.player)) API.sendToGrave(top[0],'水晶の占い師（手札に加えられない）');
      else API.searchDeck(ctx.player,top[0].index,'水晶の占い師');
      return; }
    v49P1Open(ctx,{kind:'card',title:'水晶の占い師：手札に加える1枚',
      candidates:top,min:1,max:1},
      'cbflip.peek-take-rest-bottom',
      {reason:'水晶の占い師',uids:top.map(x=>x.card.uid),lockToGrave:true},false);},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, passive:{onFlip(ctx){ return ctx.zone==='mz'; }}});

/* ===== 4. 聖なる守り手 — リバース:表側モンスター1体をデッキの一番上へ。
   自分に戦士族がいればさらに1体を手札へ戻せる ===== */
defineUnifiedCardV4('聖なる守り手',[{
  key:'flip-top-deck-then-bounce', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['onFlip'],
  condition(ctx){ return cbFlipSelf(ctx) && cbFaceUpMonsters().length>0; },
  target(ctx,done){
    API.selectCard('聖なる守り手：持ち主のデッキの一番上に戻すモンスター',
      cbFaceUpMonsters(),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(h){ ensureCardUid(gameState,h.card); API.returnToDeck(h,false,'聖なる守り手'); }
    /* 追加のバウンスは自分フィールドに戦士族がいる場合のみ */
    const hasWarrior=API.fieldCards({player:ctx.player,zone:'mz',
      filter:x=>x.card.face==='up'&&currentRaceV17(x.card)==='戦士'}).length>0;
    if(!hasWarrior) return;
    const rest=cbFaceUpMonsters();
    if(!rest.length) return;
    v49P1Open(ctx,{kind:'card',title:'聖なる守り手：さらに手札に戻すモンスター（任意）',
      candidates:rest,min:0,max:1},'cbflip.return-hand',{reason:'聖なる守り手'},false);},
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, passive:{onFlip(ctx){ return ctx.zone==='mz'; }}});

/* ===== 5. 幸運を告げるフクロウ — リバース:デッキのフィールド魔法をデッキの一番上へ。
   ネクロバレーがあれば手札に加えてもよい ===== */
function cbOwnDeckFieldSpells(p){
  return API.pileCards(p,'deck',x=>x.db.k==='s'&&x.db.sub==='フィールド');
}
function cbNecrovalleyOnField(){
  const ref=dbOf({id:findCardIndex('王家の眠る谷－ネクロバレー')});
  return API.fieldCards({zone:'field',filter:x=>x.card.face==='up'
    &&sameCanonicalCardV4(x.db||dbOf(x.card),ref)}).length>0;
}
defineUnifiedCardV4('幸運を告げるフクロウ',[{
  key:'flip-field-spell-to-top', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onFlip'],
  condition(ctx){ return cbFlipSelf(ctx) && cbOwnDeckFieldSpells(ctx.player).length>0; },
  operation(ctx){
    const pool=cbOwnDeckFieldSpells(ctx.player);
    if(!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'幸運を告げるフクロウ：選ぶフィールド魔法',
      candidates:pool,min:1,max:1},'cbflip.deck-to-top-or-hand',
      {reason:'幸運を告げるフクロウ',toHand:cbNecrovalleyOnField()},false);},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, passive:{onFlip(ctx){ return ctx.zone==='mz'; }}});

/* ===== 6. カードを狩る死神 — リバース:罠1枚を選択して破壊。セットなら確認し、
   罠なら破壊・魔法なら元に戻す ===== */
defineUnifiedCardV4('カードを狩る死神',[{
  key:'flip-destroy-trap', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  targetRange:LOCATION.SZONE, targetSide:'both', speed:1, events:['onFlip'],
  condition(ctx){ return cbFlipSelf(ctx) && cbTrapOrSet().length>0; },
  target(ctx,done){
    API.selectCard('カードを狩る死神：破壊する罠カード',cbTrapOrSet(),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    cbRevealThenDestroy(h,'t','カードを狩る死神','罠');},
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, passive:{onFlip(ctx){ return ctx.zone==='mz'; }}});

/* ===== 7. トラップ・マスター — リバース:フィールドの罠を1枚破壊（同じ裁定） ===== */
defineUnifiedCardV4('トラップ・マスター',[{
  key:'flip-destroy-trap', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  targetRange:LOCATION.SZONE, targetSide:'both', speed:1, events:['onFlip'],
  condition(ctx){ return cbFlipSelf(ctx) && cbTrapOrSet().length>0; },
  target(ctx,done){
    API.selectCard('トラップ・マスター：破壊する罠カード',cbTrapOrSet(),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    cbRevealThenDestroy(h,'t','トラップ・マスター','罠');},
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, forced:true,
    passive:{onFlip(ctx){ return ctx.zone==='mz'; }}});

/* ===== 8. 爆弾かめ虫 — リバース:相手の裏側守備モンスター1体を確認。
   効果モンスターなら破壊（リバース効果は発動しない）、違えば元に戻す ===== */
function cbFoeFaceDownMonsters(foe){
  return API.fieldCards({player:foe,zone:'mz',filter:x=>x.card.face==='down'});
}
defineUnifiedCardV4('爆弾かめ虫',[{
  key:'flip-check-facedown', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE, targetSide:'opponent', speed:1, events:['onFlip'],
  condition(ctx){ return cbFlipSelf(ctx) && cbFoeFaceDownMonsters(ctx.opponent).length>0; },
  target(ctx,done){
    API.selectCard('爆弾かめ虫：確認する相手の裏側守備モンスター',
      cbFoeFaceDownMonsters(ctx.opponent),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(!h||!h.card||h.card.face!=='down') return;
    API.reveal({player:h.p,audience:'both',cards:[h],label:'爆弾かめ虫',until:'resolution'});
    const db=h.db||dbOf(h.card);
    /* 効果モンスターかどうかは印刷された種別で判定する。裏側のままなので
       リバース効果は発動しない（破壊は表にせずに行う）。 */
    if(db.k==='m'&&(db.st||[]).includes('効果')) API.destroy(h,'爆弾かめ虫');
    else API.log('爆弾かめ虫：効果モンスターではなかったので元に戻す');},
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, forced:true,
    passive:{onFlip(ctx){ return ctx.zone==='mz'; }}});

/* ===== 9. 雷仙人 — リバース:3000LP回復。フィールドから墓地へ送られた時5000LPを失う ===== */
defineUnifiedCardV4('雷仙人',[{
  key:'flip-recover', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onFlip'],
  condition(ctx){ return cbFlipSelf(ctx); },
  operation(ctx){ API.recoverLP(ctx.player,3000); },
  afterResolve(){}
},{
  key:'leave-field-lose', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE,
  speed:1, events:['onLeaveField'],
  condition(ctx){
    const e=ctx.event||{};
    return e.uid!=null && ctx.card.uid===e.uid
      && e.fromZone==='mz' && e.toZone==='grave';},
  operation(ctx){ API.damageLP(ctx.player,5000); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, activateFrom:['grave'],
    passive:{onFlip(ctx){ return ctx.zone==='mz'; },
             onLeaveField(ctx){ return ctx.zone==='mz'&&ctx.card.face==='up'; }}});

/* ===== 10. ワーム・リンクス — リバース後、表側で存在する限り
   お互いのエンドフェイズ毎に自分は1ドロー ===== */
defineUnifiedCardV4('ワーム・リンクス',[{
  key:'flip-arm-endphase-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onFlip'],
  condition(ctx){ return cbFlipSelf(ctx) && ctx.card.cbLynxArmed!==true; },
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.setCardFlag(h,'cbLynxArmed',true,'ワーム・リンクス');},
  afterResolve(){}
},{
  key:'endphase-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onEndPhase'],
  condition(ctx){
    return cbFlipSelf(ctx) && ctx.card.cbLynxArmed===true
      && API.me(ctx).deck.length>0;},
  operation(ctx){ API.draw(ctx.player,1); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onFlip(ctx){ return ctx.zone==='mz'&&ctx.card.cbLynxArmed!==true; },
             onEndPhase(ctx){ return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.card.cbLynxArmed===true; }}});
