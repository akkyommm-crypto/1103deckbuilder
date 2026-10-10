/* LevelModifier recovery batch — System v16 のレベル修整で解消したカード。
   使う共通機構は API.modLevel / setLevel / clearLevelMods / levelOf /
   continuous.levelDelta / continuous.setLevel と、
   v15 の装備先スコープ・v14 の攻守修整・v9 の生存リンク・既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v16FaceUpMonsters(opts){
  return API.fieldCards(Object.assign({zone:'mz'},opts||{},
    {filter:x=>x.card.face==='up'&&(!opts||!opts.filter||opts.filter(x))}));
}
function v16OwnFaceUp(ctx,f){
  return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&(!f||f(x))});
}

/* ---- 選択の継続 --------------------------------------------------------- */
/* レベルを増減する（args.delta）／固定する（args.set） */
API.registerChoiceHandler('p16lv.apply',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.zone==='mz'){
    if(args.set!=null) API.setLevel(h,Number(args.set),args.until||'permanent',args.reason);
    else if(args.delta) API.modLevel(h,Number(args.delta),args.until||'permanent',args.reason);
    if(args.atk) API.modAtk(h,Number(args.atk),0,args.atkUntil||'permanent',args.reason);
  }
  v49P1FinishSource(args);
});
/* 対象が場を離れたら自分も破壊されるよう結ぶ（v9 の生存リンク） */
API.registerChoiceHandler('p16lv.shrink-and-link',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  const src=(args.sourceUid!=null)?findCardByUid(args.sourceUid):null;
  if(h&&h.zone==='mz'){
    API.modLevel(h,-1,'permanent',args.reason);
    API.modAtk(h,-1000,0,'permanent',args.reason);
    if(src) API.linkOnLeave(src,h,'destroy',args.reason);
  }
  v49P1FinishSource(args);
});

/* =====================================================================
   1. 選んだモンスターのレベルを動かすカード
   ===================================================================== */
/* 自分の表側モンスター1体のレベルを2つまで下げる */
defineUnifiedCardV4('レベル・リチューナー',[{
  key:'lower-own-level-up-to-two',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:2,events:['activate'],
  condition(ctx){ return v16OwnFaceUp(ctx).length>0; },
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'レベル・リチューナー：レベルを2つ下げるモンスター',
      candidates:v16OwnFaceUp(ctx),min:1,max:1},'p16lv.apply',
      {reason:'レベル・リチューナー',delta:-2,until:'permanent'},true);},
  afterResolve(){}
}],{type:'trap',priority:2,targets:true});

/* モンスター1体を選び、レベルを1つ上げるか下げるか選んで発動する。
   モードを選んでから対象を選ぶ、2段階の選択を継続で繋ぐ。 */
API.registerChoiceHandler('p16lv.mode-then-pick',(answer,args)=>{
  const picked=(answer&&answer.cards||[])[0];
  const delta=picked?Number(picked.value):0;
  const pool=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
  if(!delta||!pool.length){ v49P1FinishSource(args); return; }
  API.requestChoice({kind:'card',title:(args.reason||'効果')+'：対象のモンスター',
    candidates:pool,min:1,max:1,cancelable:false,
    resume:{handler:'p16lv.apply',
            args:{player:args.player,reason:args.reason,delta,until:'permanent',
                  sourceUid:args.sourceUid}}});
});
defineUnifiedCardV4('スター・チェンジャー',[{
  key:'raise-or-lower-level',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:2,events:['activate'],
  condition(){ return v16FaceUpMonsters().length>0; },
  operation(ctx){
    v49P1Open(ctx,{kind:'mode',title:'スター・チェンジャー：上げるか下げるか',
      candidates:[{key:'up',label:'レベルを1つ上げる',value:1},
                  {key:'down',label:'レベルを1つ下げる',value:-1}],min:1,max:1},
      'p16lv.mode-then-pick',{reason:'スター・チェンジャー'},true);},
  afterResolve(){}
}],{type:'spell',priority:2,targets:true});

/* 1ターンに1度、このカード以外の自分の表側モンスターのレベルを1つ上げる */
defineUnifiedCardV4('デルタフライ',[{
  key:'raise-other-own-level',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){ return v16OtherOwn(ctx).length>0; },
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'デルタフライ：レベルを1つ上げるモンスター',
      candidates:v16OtherOwn(ctx),min:1,max:1},'p16lv.apply',
      {reason:'デルタフライ',delta:1,until:'permanent'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,targets:true,timing:['mainPhase']});
function v16OtherOwn(ctx){
  return v16OwnFaceUp(ctx,x=>x.card.uid!==ctx.card.uid);
}

/* 召喚・特殊召喚成功時、自分の表側モンスター1体のレベルを3にする */
defineUnifiedCardV4('ハウリング・ウォリアー',[{
  key:'summon-set-level-three',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:1,
  events:['onNormalSummon','onSpecialSummon'],
  condition(ctx){
    const e=ctx.event||{};
    return !!(ctx.card&&e.card===ctx.card&&v16OwnFaceUp(ctx).length>0);},
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'ハウリング・ウォリアー：レベルを3にするモンスター',
      candidates:v16OwnFaceUp(ctx),min:1,max:1},'p16lv.apply',
      {reason:'ハウリング・ウォリアー',set:3,until:'permanent'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true,
    passive:{onNormalSummon:ctx=>ctx.zone==='mz',onSpecialSummon:ctx=>ctx.zone==='mz'}});

/* モンスター1体のレベルをエンドフェイズ時まで4にする */
defineUnifiedCardV4('波動共鳴',[{
  key:'set-level-four-until-end',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(){ return v16FaceUpMonsters().length>0; },
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'波動共鳴：レベルを4にするモンスター',
      candidates:v16FaceUpMonsters(),min:1,max:1},'p16lv.apply',
      {reason:'波動共鳴',set:4,until:'endPhase'},true);},
  afterResolve(){}
}],{type:'spell',priority:1,targets:true});

/* 1ターンに1度、このカードのレベルをエンドフェイズ時まで3にする */
defineUnifiedCardV4('鍵戦士キーマン',[{
  key:'self-set-level-three-until-end',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  speed:1,events:['activate'],
  condition(ctx){ return gameState.phase==='main1'||gameState.phase==='main2'; },
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.setLevel(h,3,'endPhase','鍵戦士キーマン');},
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase']});

/* 元々の攻撃力が1000より上のモンスター1体：レベル-1・攻撃力-1000。
   そのモンスターが場を離れたらこのカードは破壊される。 */
defineUnifiedCardV4('ミニチュアライズ',[{
  key:'shrink-target-and-link',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:2,events:['activate'],
  condition(){ return v16BigMonsters().length>0; },
  operation(ctx){
    ensureCardUid(gameState,ctx.card);
    v49P1Open(ctx,{kind:'card',title:'ミニチュアライズ：対象のモンスター',
      candidates:v16BigMonsters(),min:1,max:1},'p16lv.shrink-and-link',
      {reason:'ミニチュアライズ',sourceUid:ctx.card.uid},false);},
  afterResolve(){}
}],{type:'trap',priority:2,targets:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});
function v16BigMonsters(){
  return API.fieldCards({zone:'mz',
    filter:x=>x.card.face==='up'&&API.baseAtk(x)>1000});
}

/* サイキック族の召喚成功時、500払ってレベル+1・攻撃力+300 */
defineUnifiedCardV4('サイキックブレイク',[{
  key:'psychic-summon-boost',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['onNormalSummon'],
  condition(ctx){
    const e=ctx.event||{};
    return !!(e.card&&dbOf(e.card).ra==='サイキック'&&API.me(ctx).lp>500);},
  cost(ctx,done){ API.payCost(ctx.player,500); done(true); },
  operation(ctx){
    const h=locateCardAnyV4(ctx.event.card);
    if(!h) return;
    API.modLevel(h,1,'permanent','サイキックブレイク');
    API.modAtk(h,300,0,'permanent','サイキックブレイク');},
  afterResolve(){}
}],{type:'spell',priority:1,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onNormalSummon:ctx=>ctx.zone==='sz'}});

/* =====================================================================
   2. 永続的にレベルを動かすカード
   ===================================================================== */
/* 装備モンスターのレベルを2つ下げる */
defineScript('降格処分',{
  type:'spell', priority:1, condition(){ return true; },
  resolve(){ API.log('降格処分：装備モンスターのレベルが2つ下がる'); },
  afterResolve(){},
  continuous:{scope:'equippedMonster', from:['sz'], apply(){ return null; },
    levelDelta(){ return -2; }}
});
/* 装備モンスターのレベルは1つ上がり、攻撃力は500アップする */
defineScript('シンクロ・ヒーロー',{
  type:'spell', priority:1, condition(){ return true; },
  resolve(){ API.log('シンクロ・ヒーロー：装備モンスターのレベル+1・攻撃力+500'); },
  afterResolve(){},
  continuous:{scope:'equippedMonster', from:['sz'],
    apply(){ return {atk:500}; },
    levelDelta(){ return 1; }}
});
/* 相手フィールドの全てのモンスターのレベルは1つ下がる */
defineScript('デビリアン・ソング',{
  type:'trap', priority:2, condition(){ return true; },
  resolve(){ API.log('デビリアン・ソング：相手モンスターのレベルが1つ下がる'); },
  afterResolve(){},
  continuous:{scope:'oppMonsters', from:['sz'], apply(){ return null; },
    levelDelta(){ return -1; }}
});
/* 表側守備表示で存在する限り、このカードのレベルは4になる */
defineScript('シャインナイト',{
  continuous:{scope:'self', from:['mz'], apply(){ return null; },
    setLevel(card){ return (card.face==='up'&&card.pos==='def')?4:null; }}
});

/* コストダウン（手札のモンスターへ届く player scope）、
   フルエルフ（手札公開の選択）、星蝕－レベル・クライム－（複数の連動SET）、
   グリード・クエーサー・フォーチュンレディ・アーシー（レベルから元々の数値を
   逆算する動的 base）、龍炎剣の使い手 などは別primitiveが要るため
   ENGINE_GAP のまま残す。 */
