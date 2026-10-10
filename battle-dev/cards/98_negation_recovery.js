/* Negation recovery batch — System v13 の効果無効で解消したカード。
   使う共通機構は API.negateEffectUntil / clearNegateEffect /
   negateChainLink / chainLinkNegated / isEffectNegated と、
   v12 の発動イベント・v11 のトークン・既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v13Opponent(p){ return p===0?1:0; }
/* 発動イベントが指すカードが、指定した正規カードと同じか */
function v13ActivatedCardIs(evt,name){
  if(!evt || evt.cardId==null) return false;
  const a=CARD_DB[evt.cardId], b=dbOf({id:findCardIndex(name)});
  return !!(a&&b&&sameCanonicalCardV4(a,b));
}
/* 「相手が◯◯を発動した時」の共通条件 */
function v13OpponentActivated(ctx,kind,sub){
  const e=ctx.event;
  if(!e || e.player!==ctx.opponent) return false;
  if(kind==='spell') return API.isSpellActivation(e,sub);
  if(kind==='trap')  return API.isTrapActivation(e,sub);
  if(kind==='monster') return !!(e.kind==='monster');
  return true;
}
/* 場の表側カードを条件で集める */
function v13FaceUp(f){ return API.fieldCards({filter:x=>x.card.face==='up'&&(!f||f(x))}); }
/* 永続魔法・永続罠・フィールド魔法の判定（カードの sub を見る） */
function v13IsSub(db,k,sub){ return !!(db&&db.k===k&&db.sub===sub); }
/* 蘇生してから、そのモンスターの効果を無効にする共通処理 */
function v13ReviveNegated(ctx,handle,pos,label){
  if(!handle||handle.zone!=='grave'||!hasMonsterZoneSpace(ctx.player)) return null;
  ensureCardUid(gameState,handle.card);
  const uid=handle.card.uid;
  API.specialSummon(ctx.player,'grave',handle.index,pos||'atk',label);
  const now=findCardByUid(uid);
  if(!now||now.zone!=='mz') return null;
  API.negateEffectUntil(now,'permanent',label,ctx.card);
  return now;
}

/* ---- 選択の継続 --------------------------------------------------------- */
API.registerChoiceHandler('p13neg.revive-negated',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  const src=(args.sourceUid!=null)?findCardByUid(args.sourceUid):null;
  if(h&&h.p===args.player&&h.zone==='grave'&&hasMonsterZoneSpace(args.player)){
    const uid=picked.card.uid;
    API.specialSummon(args.player,'grave',h.index,args.pos||'atk',args.reason);
    const now=findCardByUid(uid);
    if(now&&now.zone==='mz') API.negateEffectUntil(now,'permanent',args.reason,src?src.card:null);
  }
  if(args.giftTokens){
    API.createTokens(v13Opponent(args.player),'ギフト・デモン・トークン',2,
      src?{p:src.p,zone:src.zone,index:src.index,card:src.card}:null);
  }
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p13neg.negate-until-end',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  const src=(args.sourceUid!=null)?findCardByUid(args.sourceUid):null;
  if(h){
    if(Number(args.atkUp)) API.modAtk(h,Number(args.atkUp),0,'endPhase',args.reason);
    API.negateEffectUntil(h,'endTurn',args.reason,src?src.card:null);
  }
  v49P1FinishSource(args);
});

/* =====================================================================
   1. 蘇生したモンスターの効果を無効にする
   ===================================================================== */
defineUnifiedCardV4('ギアギアーノ',[{
  key:'tribute-self-revive-machine-negated',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){ return v13Lv4Machines(ctx).length>0&&hasMonsterZoneSpace(ctx.player); },
  cost(ctx,done){
    const h=locateCardAnyV4(ctx.card);
    if(!h||h.zone!=='mz'){ done(false); return; }
    API.sendToGrave(h,'ギアギアーノ（リリース）'); done(true);},
  operation(ctx){
    const pool=v13Lv4Machines(ctx);
    if(!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'ギアギアーノ：特殊召喚する機械族',
      candidates:pool,min:1,max:1},'p13neg.revive-negated',
      {reason:'ギアギアーノ',pos:'atk'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true,includesSpecialSummon:true,timing:['mainPhase']});
function v13Lv4Machines(ctx){
  return API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.ra==='機械'&&(x.db.lv||0)===4);
}

defineUnifiedCardV4('ブラック・ボンバー',[{
  key:'summon-revive-dark-machine-negated',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['onNormalSummon'],
  condition(ctx){
    return !!(ctx.event&&ctx.event.card===ctx.card)
      &&v13DarkMachines(ctx).length>0&&hasMonsterZoneSpace(ctx.player);},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    const pool=v13DarkMachines(ctx);
    v13ReviveNegated(ctx,t&&t.zone==='grave'?t:resolveTarget(pool[0]),'def','ブラック・ボンバー');},
  target(ctx,done){
    API.selectCard('ブラック・ボンバー：特殊召喚するモンスター',v13DarkMachines(ctx),t=>done([t]));},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true,includesSpecialSummon:true,
    passive:{onNormalSummon:ctx=>ctx.zone==='mz'}});
function v13DarkMachines(ctx){
  return API.pileCards(ctx.player,'grave',
    x=>x.db.k==='m'&&x.db.ra==='機械'&&x.db.at==='闇'&&(x.db.lv||0)===4);
}

defineUnifiedCardV4('ロックキャット',[{
  key:'summon-revive-lv1-beast-negated',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['onNormalSummon'],
  condition(ctx){
    return !!(ctx.event&&ctx.event.card===ctx.card)
      &&v13Lv1Beasts(ctx).length>0&&hasMonsterZoneSpace(ctx.player);},
  target(ctx,done){
    API.selectCard('ロックキャット：特殊召喚する獣族',v13Lv1Beasts(ctx),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    const pool=v13Lv1Beasts(ctx);
    v13ReviveNegated(ctx,t&&t.zone==='grave'?t:resolveTarget(pool[0]),'def','ロックキャット');},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true,includesSpecialSummon:true,
    passive:{onNormalSummon:ctx=>ctx.zone==='mz'}});
function v13Lv1Beasts(ctx){
  return API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.ra==='獣'&&(x.db.lv||0)===1);
}

/* チューナーを蘇生（効果無効）し、相手にギフト・デモン・トークン2体 */
defineTokenSpecV11('ギフト・デモン・トークン',{atk:1500,def:1500,lv:3,ra:'悪魔',at:'闇',pos:'atk'});
defineUnifiedCardV4('リバイバル・ギフト',[{
  key:'revive-tuner-negated-give-tokens',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.GRAVE,targetSide:'self',speed:2,events:['activate'],
  condition(ctx){ return v13Tuners(ctx).length>0&&hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    ensureCardUid(gameState,ctx.card);
    v49P1Open(ctx,{kind:'card',title:'リバイバル・ギフト：特殊召喚するチューナー',
      candidates:v13Tuners(ctx),min:1,max:1},'p13neg.revive-negated',
      {reason:'リバイバル・ギフト',pos:'atk',giftTokens:true},true);},
  afterResolve(){}
}],{type:'trap',priority:2,targets:true,includesSpecialSummon:true});
function v13Tuners(ctx){
  return API.pileCards(ctx.player,'grave',
    x=>x.db.k==='m'&&/チューナー/.test(String((x.db.st||[]).join('')||x.db.e||'')));
}

/* =====================================================================
   2. ターン終了時までの一括無効
   ===================================================================== */
/* 永続罠が発動された時、ターン終了時まで全ての永続罠の効果を無効にする */
defineUnifiedCardV4('金属探知器',[{
  key:'continuous-trap-activated-negate-all',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['onActivateSuccess'],
  condition(ctx){
    const e=ctx.event;
    return !!(e&&e.uid!==ctx.card.uid&&API.isTrapActivation(e,'continuous'));},
  operation(ctx){
    v13FaceUp(x=>v13IsSub(x.db,'t','永続'))
      .forEach(x=>API.negateEffectUntil(x,'endTurn','金属探知器',ctx.card));},
  afterResolve(){}
}],{type:'trap',priority:2});

/* 永続魔法が発動された時、ターン終了時まで全ての永続魔法の効果を無効にする */
defineUnifiedCardV4('魔法探査の石版',[{
  key:'continuous-spell-activated-negate-all',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['onActivateSuccess'],
  condition(ctx){
    const e=ctx.event;
    return !!(e&&e.uid!==ctx.card.uid&&API.isSpellActivation(e,'continuous'));},
  operation(ctx){
    v13FaceUp(x=>v13IsSub(x.db,'s','永続'))
      .forEach(x=>API.negateEffectUntil(x,'endTurn','魔法探査の石版',ctx.card));},
  afterResolve(){}
}],{type:'trap',priority:2});

/* フィールドカードが発動された時、ターン終了時までその効果を無効にする */
defineUnifiedCardV4('世界の平定',[{
  key:'field-activated-negate-field',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['onActivateSuccess'],
  condition(ctx){
    const e=ctx.event;
    return !!(e&&e.uid!==ctx.card.uid&&API.isSpellActivation(e,'field'));},
  operation(ctx){
    v13FaceUp(x=>x.zone==='field')
      .forEach(x=>API.negateEffectUntil(x,'endTurn','世界の平定',ctx.card));},
  afterResolve(){}
}],{type:'trap',priority:2});

/* バトルフェイズ中のみ：相手の守備表示モンスターを表側攻撃表示にし、効果を無効にする */
defineUnifiedCardV4('ディフェンダーズ・クロス',[{
  key:'battle-phase-flip-attack-and-negate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['activate'],
  condition(ctx){
    return gameState.phase==='battle'
      &&API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.pos==='def'}).length>0;},
  operation(ctx){
    API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.pos==='def'})
      .slice().reverse().forEach(x=>{
        const h=locateCardAnyV4(x.card); if(!h) return;
        if(h.card.face==='down') API.flipFaceUpByEffect(h,'atk','ディフェンダーズ・クロス');
        else API.changePosition(h,'atk','ディフェンダーズ・クロス');
        const now=locateCardAnyV4(x.card);
        if(now) API.negateEffectUntil(now,'permanent','ディフェンダーズ・クロス',ctx.card);
      });},
  afterResolve(){}
}],{type:'trap',priority:2});

/* 「カラクリ」1体を選択：エンドフェイズ時まで攻撃力+1000、効果は無効 */
defineUnifiedCardV4('カラクリ大暴走',[{
  key:'karakuri-pump-and-negate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:2,events:['activate'],
  condition(){ return v13KarakuriOnField().length>0; },
  operation(ctx){
    ensureCardUid(gameState,ctx.card);
    v49P1Open(ctx,{kind:'card',title:'カラクリ大暴走：対象の「カラクリ」',
      candidates:v13KarakuriOnField(),min:1,max:1},'p13neg.negate-until-end',
      {reason:'カラクリ大暴走',atkUp:1000,sourceUid:ctx.card.uid},true);},
  afterResolve(){}
}],{type:'spell',priority:2,targets:true});
function v13KarakuriOnField(){
  return API.fieldCards({zone:'mz',
    filter:x=>x.card.face==='up'&&String(x.db.n||'').indexOf('カラクリ')>=0});
}

/* =====================================================================
   3. チェーンリンクを指定して無効にする
   ===================================================================== */
/* 相手の永続罠の発動と効果を無効にし破壊する */
defineUnifiedCardV4('王宮の陥落',[{
  key:'negate-continuous-trap-activation',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:3,events:['onActivateSuccess'],
  condition(ctx){ return v13OpponentActivated(ctx,'trap','continuous'); },
  operation(ctx){ API.negateChainLink(ctx.event,'activation','王宮の陥落',true); },
  afterResolve(){}
}],{type:'trap',priority:3});

/* 相手の永続魔法の発動と効果を無効にし破壊する */
defineUnifiedCardV4('魔力終了宣告',[{
  key:'negate-continuous-spell-activation',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:3,events:['onActivateSuccess'],
  condition(ctx){ return v13OpponentActivated(ctx,'spell','continuous'); },
  operation(ctx){ API.negateChainLink(ctx.event,'activation','魔力終了宣告',true); },
  afterResolve(){}
}],{type:'trap',priority:3});

/* 「ヴェノム」を見せて、相手の魔法の発動と効果を無効にし破壊する */
defineUnifiedCardV4('蛇神の勅命',[{
  key:'reveal-venom-negate-spell',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:3,events:['onActivateSuccess'],
  condition(ctx){
    return v13OpponentActivated(ctx,'spell')&&v13VenomInHand(ctx).length>0;},
  operation(ctx){ API.negateChainLink(ctx.event,'activation','蛇神の勅命',true); },
  afterResolve(){}
}],{type:'trap',priority:3});
function v13VenomInHand(ctx){
  return API.pileCards(ctx.player,'hand',
    x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.VENOM));
}

/* バトルフェイズ中のみ：相手が発動した効果モンスターの効果を無効にし破壊する */
defineUnifiedCardV4('威風堂々',[{
  key:'battle-phase-negate-monster-effect',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:3,events:['onActivateSuccess'],
  condition(ctx){
    return gameState.phase==='battle'&&v13OpponentActivated(ctx,'monster');},
  operation(ctx){ API.negateChainLink(ctx.event,'effect','威風堂々',true); },
  afterResolve(){}
}],{type:'trap',priority:3});

/* 「強欲な壺」の効果を無効にし、1枚ドローする */
defineUnifiedCardV4('壺盗み',[{
  key:'negate-pot-of-greed-and-draw',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['onActivateSuccess'],
  condition(ctx){
    return !!(ctx.event&&ctx.event.uid!==ctx.card.uid
      &&v13ActivatedCardIs(ctx.event,'強欲な壺'));},
  operation(ctx){
    API.negateChainLink(ctx.event,'effect','壺盗み',false);
    API.draw(ctx.player,1);},
  afterResolve(){}
}],{type:'spell',priority:2});

/* 相手の「死者蘇生」の効果を無効にする */
defineUnifiedCardV4('墓場からの呼び声',[{
  key:'negate-monster-reborn',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['onActivateSuccess'],
  condition(ctx){
    return v13OpponentActivated(ctx,'spell')&&v13ActivatedCardIs(ctx.event,'死者蘇生');},
  operation(ctx){ API.negateChainLink(ctx.event,'effect','墓場からの呼び声',false); },
  afterResolve(){}
}],{type:'trap',priority:2});

/* 相手の「ハーピィの羽根帚」の効果を無効にし、相手の魔法・罠を全て破壊する */
defineUnifiedCardV4('グリフォンの翼',[{
  key:'negate-harpies-feather-duster',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['onActivateSuccess'],
  condition(ctx){
    return v13OpponentActivated(ctx,'spell')
      &&v13ActivatedCardIs(ctx.event,'ハーピィの羽根帚');},
  operation(ctx){
    API.negateChainLink(ctx.event,'effect','グリフォンの翼',false);
    API.fieldCards({player:ctx.opponent,filter:x=>x.zone==='sz'||x.zone==='field'})
      .slice().reverse().forEach(x=>{
        const h=locateCardAnyV4(x.card);
        if(h) API.destroy(h,'グリフォンの翼');});},
  afterResolve(){}
}],{type:'trap',priority:2});

/* スターダスト・ドラゴン / ダメージ・ポラリライザー / ヂェミナイ・デビル などは
   「フィールドのカードを破壊する効果」「ダメージを与える効果」「手札を捨てる効果」
   といった効果カテゴリのmetadataが別に要るため ENGINE_GAP のまま残す。
   墓地封印・トライアングル・X・スパークは発動そのものの禁止（activation
   prohibition）が要るため、無効化とは別のprimitiveになる。
   ガオドレイクのタテガミは「攻撃力が3000になる」SET修整が要る。 */
