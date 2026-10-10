/* Position recovery batch — System v10 の表示形式イベントと永続強制で解消したカード。
   使う共通機構は onPositionChange / continuous.forcedPosition /
   continuous.cannotChangePosition / continuous.positionWindow /
   API.flipFaceUpByEffect / API.turnedToFaceUpDefense と既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* 「カラクリ」は setcode overlay に無いので、カード側で名前判定する。 */
function v10IsKarakuri(db){ return String(db&&db.n||'').indexOf('カラクリ')>=0; }
/* 変更されたカードを事件から引く */
function v10ChangedHandle(evt){
  const c=API.positionChangedCard(evt);
  return c?locateCardAnyV4(c):null;
}
/* 「このカードの表示形式が攻撃表示から表側守備表示に変わった時」の共通条件 */
function v10SelfTurnedToDefense(ctx){
  return !!(ctx.event&&ctx.card&&ctx.event.uid===ctx.card.uid
            &&API.turnedToFaceUpDefense(ctx.event));
}
/* 表示形式を1体分変更する。裏側なら効果で表側攻撃表示にする。 */
function v10ChangeOne(handle,reason){
  if(!handle||handle.zone!=='mz') return false;
  if(handle.card.face==='down') return API.flipFaceUpByEffect(handle,'atk',reason);
  API.changePosition(handle,handle.card.pos==='atk'?'def':'atk',reason);
  return true;
}

/* ---- 選択の継続（すべて登録名 + JSON引数だけで復帰できる形） ------------- */
API.registerChoiceHandler('p10pos.destroy-one',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h) API.destroy(h,args.reason);
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p10pos.change-position',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    const h=locateCardAnyV4(picked.card);
    if(h&&h.zone==='mz') v10ChangeOne(h,args.reason);
  }
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p10pos.hand-to-deck-bottom',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    const h=locateCardAnyV4(picked.card);
    if(h&&h.p===args.player&&h.zone==='hand') API.returnToDeck(h,true,args.reason);
  }
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p10pos.equip-source',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const t=picked&&locateCardAnyV4(picked.card);
  const s=args.sourceUid!=null?findCardByUid(args.sourceUid):null;
  if(s&&t&&t.zone==='mz') API.equipSpell(s,t,args.reason);
});
API.registerChoiceHandler('p10pos.deck-to-hand-then-change',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.p===args.player&&h.zone==='deck') API.deckToHand(args.player,h.index,args.reason);
  API.shuffle(args.player);
  const t=args.targetUid!=null?findCardByUid(args.targetUid):null;
  if(t&&t.zone==='mz') v10ChangeOne(t,args.reason);
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p10pos.guard-penalty-mark',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  /* 監視は「このターン・この宣言者」だけ。世代は turn で閉じる。 */
  if(h&&h.zone==='mz') API.setCardFlag(h,'v10GuardPenalty',
    {turn:gameState.turn,player:args.player},args.reason);
  v49P1FinishSource(args);
});

/* =====================================================================
   1. 永続の強制表示形式
   ===================================================================== */
/* レベル4以上のモンスターは守備表示になる */
defineScript('レベル制限B地区',{
  continuous:{
    scope:'allMonsters', from:['sz'], apply(){ return null; },
    forcedPosition(target){ return curLV(target)>=4?'def':null; }
  },
  type:'spell', priority:1, condition(){ return true; },
  resolve(){ API.log('レベル制限B地区：レベル4以上のモンスターは守備表示になる'); },
  afterResolve(){}
});
/* 表側表示のレベル3以下のモンスターは全て攻撃表示になる */
defineScript('レベル制限A地区',{
  continuous:{
    scope:'allMonsters', from:['sz'], apply(){ return null; },
    forcedPosition(target){ return curLV(target)<=3?'atk':null; }
  },
  type:'trap', priority:2, condition(){ return true; },
  resolve(){ API.log('レベル制限A地区：レベル3以下のモンスターは攻撃表示になる'); },
  afterResolve(){}
});
/* 自分のエンドフェイズに1度だけ表示形式を変更できる */
defineScript('リトル・ウィンガード',{
  continuous:{
    scope:'self', from:['mz'], apply(){ return null; },
    positionWindow(){ return ['end']; }
  }
});

/* =====================================================================
   2. 表示形式が変わった時に誘発するカード
   ===================================================================== */
/* 攻撃表示から表側守備表示に変わった時、相手モンスター1体を破壊する */
defineUnifiedCardV4('ブレードラビット',[{
  key:'turned-defense-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['onPositionChange'],
  condition(ctx){
    return v10SelfTurnedToDefense(ctx)
      &&API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;},
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'ブレードラビット：破壊する相手モンスター',
      candidates:API.fieldCards({player:ctx.opponent,zone:'mz'}),min:1,max:1},
      'p10pos.destroy-one',{reason:'ブレードラビット'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true});
/* 攻撃表示から表側守備表示に変わった時、自分のデッキをシャッフルする */
defineUnifiedCardV4('悪魔の知恵',[{
  key:'turned-defense-shuffle',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onPositionChange'],forced:true,
  condition(ctx){ return v10SelfTurnedToDefense(ctx); },
  operation(ctx){ API.shuffle(ctx.player); API.log('悪魔の知恵：デッキをシャッフルした'); },
  afterResolve(){}
}],{type:'monster',priority:1});
/* 攻撃表示から表側守備表示に変わった時、手札を任意の枚数デッキの一番下に戻せる */
defineUnifiedCardV4('ヤドカリュー',[{
  key:'turned-defense-hand-to-deck-bottom',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onPositionChange'],
  condition(ctx){ return v10SelfTurnedToDefense(ctx)&&API.me(ctx).hand.length>0; },
  operation(ctx){
    const hand=API.pileCards(ctx.player,'hand');
    v49P1Open(ctx,{kind:'card',title:'ヤドカリュー：デッキの一番下に戻す手札（任意の枚数）',
      candidates:hand,min:0,max:hand.length},
      'p10pos.hand-to-deck-bottom',{reason:'ヤドカリュー'},false);},
  afterResolve(){}
}],{type:'monster',priority:1});
/* 相手の表側攻撃表示モンスターが表側守備表示になった時、守備表示を全て破壊する */
defineUnifiedCardV4('断頭台の惨劇',[{
  key:'opponent-turned-defense-wipe',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,
  events:['onPositionChange'],
  condition(ctx){
    const e=ctx.event||{};
    return e.player===ctx.opponent&&API.turnedToFaceUpDefense(e);},
  operation(ctx){
    API.fieldCards({player:ctx.opponent,zone:'mz',
      filter:x=>x.card.pos==='def'}).slice().reverse()
      .forEach(x=>API.destroy(x,'断頭台の惨劇'));},
  afterResolve(){}
}],{type:'trap',priority:2});
/* 自分の表側「カラクリ」の表示形式が変更された時、フィールドのカード1枚を破壊する */
defineUnifiedCardV4('カラクリ屋敷',[{
  key:'karakuri-position-changed-destroy',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.ONFIELD,targetSide:'both',speed:2,events:['onPositionChange'],
  condition(ctx){
    const h=v10ChangedHandle(ctx.event);
    return !!(h&&h.p===ctx.player&&h.zone==='mz'&&h.card.face==='up'
              &&v10IsKarakuri(dbOf(h.card))
              &&API.fieldCards({}).length>0);},
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'カラクリ屋敷：破壊するカード',
      candidates:API.fieldCards({}),min:1,max:1},
      'p10pos.destroy-one',{reason:'カラクリ屋敷'},true);},
  afterResolve(){}
}],{type:'trap',priority:2,targets:true});
/* 選択したモンスターがこのターン守備表示になった場合、1枚ドローする */
defineUnifiedCardV4('ガードペナルティ',[{
  key:'mark-target',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){ return API.fieldCards({zone:'mz'}).length>0; },
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'ガードペナルティ：監視するモンスター',
      candidates:API.fieldCards({zone:'mz'}),min:1,max:1},
      'p10pos.guard-penalty-mark',{reason:'ガードペナルティ'},true);},
  afterResolve(){}
},{
  key:'watched-turned-defense-draw',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,
  events:['onPositionChange'],forced:true,
  condition(ctx){
    const e=ctx.event||{};
    if(e.toFace!=='up'||e.toPos!=='def') return false;
    const h=v10ChangedHandle(e); if(!h) return false;
    const mark=h.card.v10GuardPenalty;
    return !!(mark&&mark.turn===gameState.turn&&mark.player===ctx.player);},
  operation(ctx){ API.draw(ctx.player,1); },
  afterResolve(){}
}],{type:'spell',priority:1,targets:true});
/* 「D」モンスターに装備。装備モンスターの表示形式が変更される度に魔法・罠1枚を破壊する */
defineUnifiedCardV4('D・コード',[{
  key:'equip-to-morphtronic',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){ return v10MorphtronicTargets().length>0; },
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'D・コード：装備するモンスター',
      candidates:v10MorphtronicTargets(),min:1,max:1},
      'p10pos.equip-source',{reason:'D・コード'},true);},
  afterResolve(){}
},{
  key:'equipped-position-changed-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,
  targetRange:LOCATION.ONFIELD,targetSide:'both',speed:1,events:['onPositionChange'],
  forced:true,
  condition(ctx){
    const e=ctx.event||{},eq=ctx.card&&ctx.card.equipTo;
    return !!(eq&&e.uid===eq.uid&&v10SpellTrapOnField().length>0);},
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'D・コード：破壊する魔法・罠',
      candidates:v10SpellTrapOnField(),min:1,max:1},
      'p10pos.destroy-one',{reason:'D・コード'},false);},
  afterResolve(){}
}],{type:'spell',priority:1,targets:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});
function v10MorphtronicTargets(){
  return API.fieldCards({zone:'mz',
    filter:x=>x.card.face==='up'&&x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.D_MORPHTRONIC)});
}
function v10SpellTrapOnField(){
  return API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'});
}

/* =====================================================================
   3. まとめて表示形式を変えるカード
   ===================================================================== */
/* 相手フィールドの裏側モンスターを全て表側表示にする */
defineUnifiedCardV4('闇をかき消す光',[{
  key:'flip-all-opponent-face-down',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,
  events:['activate'],
  condition(ctx){
    return API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='down'}).length>0;},
  operation(ctx){
    /* 表示形式は保ったまま表側にする。リバース効果は共通機構が発火させる。 */
    const list=API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='down'});
    list.slice().reverse().forEach(x=>{
      const h=locateCardAnyV4(x.card);
      if(h) API.flipFaceUpByEffect(h,h.card.pos||'def','闇をかき消す光');});},
  afterResolve(){}
}],{type:'spell',priority:1});
/* 手札を1枚捨てて、相手フィールドの全モンスターの表示形式を変更する */
defineUnifiedCardV4('カード・フリッパー',[{
  key:'flip-all-opponent-monsters',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,
  events:['activate'],
  condition(ctx){
    return API.me(ctx).hand.length>0
      &&API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;},
  cost(ctx,done){
    const hand=API.pileCards(ctx.player,'hand');
    if(!hand.length){done(false);return;}
    API.selectCard('カード・フリッパー：捨てる手札',hand,t=>{
      const h=resolveTarget(t);
      if(h) API.discard(ctx.player,h.index,'カード・フリッパー（コスト）',{byEffect:false});
      done(!!h);});},
  operation(ctx){
    API.fieldCards({player:ctx.opponent,zone:'mz'}).slice().reverse().forEach(x=>{
      const h=locateCardAnyV4(x.card);
      if(h) v10ChangeOne(h,'カード・フリッパー');});},
  afterResolve(){}
}],{type:'spell',priority:1});
/* 手札から墓地へ送り、自分の表側「D」を任意の数だけ表示形式変更する */
defineUnifiedCardV4('ガジェット・ドライバー',[{
  key:'discard-self-change-morphtronics',type:EFFECT_TYPE.IGNITION,range:LOCATION.HAND,speed:2,
  events:['activate'],
  condition(ctx){ return v10OwnMorphtronics(ctx).length>0; },
  cost(ctx,done){
    const h=locateCardAnyV4(ctx.card);
    if(!h||h.zone!=='hand'){done(false);return;}
    API.sendHandToGrave(ctx.player,h.index,'ガジェット・ドライバー（コスト）');
    done(true);},
  operation(ctx){
    const pool=v10OwnMorphtronics(ctx);
    v49P1Open(ctx,{kind:'card',title:'ガジェット・ドライバー：表示形式を変更する「D」（任意の数）',
      candidates:pool,min:0,max:pool.length},
      'p10pos.change-position',{reason:'ガジェット・ドライバー'},false);},
  afterResolve(){}
}],{type:'monster',priority:2,activateFrom:['hand'],timing:['mainPhase','opponentTurn']});
function v10OwnMorphtronics(ctx){
  return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.D_MORPHTRONIC)});
}
/* 自分の表側「カラクリ」1体を選び、デッキからレベル4以下の「カラクリ」を手札に加え、
   選んだモンスターの表示形式を変更する */
defineUnifiedCardV4('借カラクリ蔵',[{
  key:'search-karakuri-and-change',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){
    return v10OwnKarakuri(ctx).length>0
      &&API.pileCards(ctx.player,'deck',
          x=>x.db.k==='m'&&v10IsKarakuri(x.db)&&(x.db.lv||99)<=4).length>0;},
  target(ctx,done){
    API.selectCard('借カラクリ蔵：表示形式を変更する「カラクリ」',v10OwnKarakuri(ctx),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!t) return;
    ensureCardUid(gameState,t.card);
    const pool=API.pileCards(ctx.player,'deck',
      x=>x.db.k==='m'&&v10IsKarakuri(x.db)&&(x.db.lv||99)<=4);
    if(!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'借カラクリ蔵：手札に加える「カラクリ」',
      candidates:pool,min:1,max:1},
      'p10pos.deck-to-hand-then-change',{reason:'借カラクリ蔵',targetUid:t.card.uid},true);},
  afterResolve(){}
}],{type:'spell',priority:1,targets:true});
function v10OwnKarakuri(ctx){
  return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&x.db.k==='m'&&v10IsKarakuri(x.db)});
}

/* インセクト・プリンセスは「戦闘で昆虫族を破壊する度に攻撃力が上がる」側に
   『破壊した側』を識別する戦闘イベントが別に要るため ENGINE_GAP のまま残す。
   （onBattleDestroy は破壊された側にしか届かない。）
   スペースタイムポリス・静寂虫・氷結界の大僧正などは、
   「召喚成功時に必ず守備表示にする」召喚手順側の強制が別に要るため、
   今回は ENGINE_GAP のまま残す。 */
