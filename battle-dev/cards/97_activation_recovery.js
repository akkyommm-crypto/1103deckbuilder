/* Activation recovery batch — System v12 の発動イベントで解消したカード。
   使う共通機構は onActivateSuccess / API.isSpellActivation /
   isTrapActivation / isCounterTrapActivation / activationSource /
   activationLink と既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v12Opponent(p){ return p===0?1:0; }
/* 「自分または相手が〜を発動する度に」。自分自身の発動では誘発しない。 */
function v12OtherActivation(ctx){
  const e=ctx.event;
  return !!(e&&ctx.card&&e.uid!==ctx.card.uid);
}
function v12SpellBy(ctx,who,sub){
  if(!v12OtherActivation(ctx)) return false;
  if(!API.isSpellActivation(ctx.event,sub)) return false;
  if(who==='opponent') return ctx.event.player===ctx.opponent;
  if(who==='self') return ctx.event.player===ctx.player;
  return true;
}
function v12TrapBy(ctx,who,sub){
  if(!v12OtherActivation(ctx)) return false;
  if(!API.isTrapActivation(ctx.event,sub)) return false;
  if(who==='opponent') return ctx.event.player===ctx.opponent;
  if(who==='self') return ctx.event.player===ctx.player;
  return true;
}
/* 魔力カウンターを1つ置く（上限があれば超えない） */
function v12AddSpellCounter(ctx,cap){
  const h=locateCardAnyV4(ctx.card); if(!h) return 0;
  const now=API.countCounter(h,'魔力');
  if(cap!=null && now>=cap) return now;
  API.addCounter(h,'魔力',1);
  return API.countCounter(h,'魔力');
}
function v12SpellCounters(card){
  const h=locateCardAnyV4(card); return h?API.countCounter(h,'魔力'):0;
}
/* 場のカード（表側・裏側を問わない） */
function v12FieldAll(){ return API.fieldCards({}); }

/* ---- 選択の継続 --------------------------------------------------------- */
API.registerChoiceHandler('p12act.destroy-one',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h) API.destroy(h,args.reason);
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p12act.banish-to-hand',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    const h=locateCardAnyV4(picked.card);
    if(h&&h.p===args.player&&h.zone==='banish') API.returnToHand(h,args.reason);
  }
  v49P1FinishSource(args);
});
/* 魔力カウンターを n 個取り除いてからモンスター1体を破壊する */
API.registerChoiceHandler('p12act.spend-counters-destroy',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const src=(args.sourceUid!=null)?findCardByUid(args.sourceUid):null;
  const h=picked&&locateCardAnyV4(picked.card);
  if(src&&h&&Number(args.spend)>0){
    API.removeCounter(src,'魔力',Number(args.spend));
    API.destroy(h,args.reason);
  }
});

/* =====================================================================
   1. 魔法の発動に反応する
   ===================================================================== */
/* 魔法カードが発動する度に、このカードのコントローラーは500回復する */
defineUnifiedCardV4('魔法吸収',[{
  key:'spell-activated-recover',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){ return v12SpellBy(ctx,'any'); },
  operation(ctx){ API.recoverLP(ctx.player,500); },
  afterResolve(){}
}],{type:'spell',priority:1,
    continuous:{scope:'self',from:['sz','field'],apply(){return null;}}});

/* 魔法カードが発動する度に、その発動したプレイヤーに1000ダメージ */
defineUnifiedCardV4('暗黒の呪縛',[{
  key:'spell-activated-burn-activator',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){ return v12SpellBy(ctx,'any'); },
  operation(ctx){ API.damageLP(ctx.event.player,1000); },
  afterResolve(){}
}],{type:'trap',priority:2,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

/* 罠カードを発動したプレイヤーに1000ダメージ */
defineUnifiedCardV4('連鎖炸薬',[{
  key:'trap-activated-burn-activator',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){ return v12TrapBy(ctx,'any'); },
  operation(ctx){ API.damageLP(ctx.event.player,1000); },
  afterResolve(){}
}],{type:'trap',priority:2,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

/* 魔法が発動する度に魔力カウンター（最大3）。3つ取り除いて1枚ドロー */
defineUnifiedCardV4('王立魔法図書館',[{
  key:'spell-activated-add-counter',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){ return v12SpellBy(ctx,'any')&&v12SpellCounters(ctx.card)<3; },
  operation(ctx){ v12AddSpellCounter(ctx,3); },
  afterResolve(){}
},{
  key:'spend-three-counters-draw',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,
  events:['activate'],
  condition(ctx){ return v12SpellCounters(ctx.card)>=3&&API.me(ctx).deck.length>0; },
  cost(ctx,done){
    const h=locateCardAnyV4(ctx.card);
    if(!h||API.countCounter(h,'魔力')<3){ done(false); return; }
    API.removeCounter(h,'魔力',3); done(true);},
  operation(ctx){ API.draw(ctx.player,1); },
  afterResolve(){}
}],{type:'monster',priority:1,timing:['mainPhase']});

/* 魔法が発動する度にカウンター。4つ目が乗った時に自壊し、
   その魔法を発動したプレイヤーは3000ダメージを受ける */
defineUnifiedCardV4('バベル・タワー',[{
  key:'spell-activated-count-and-burst',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){ return v12SpellBy(ctx,'any'); },
  operation(ctx){
    const n=v12AddSpellCounter(ctx,null);
    if(n>=4){
      const who=ctx.event.player;
      const h=locateCardAnyV4(ctx.card);
      if(h) API.destroy(h,'バベル・タワー');
      API.damageLP(who,3000);
    }},
  afterResolve(){}
}],{type:'trap',priority:2,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

/* 魔法が発動する度にカウンター。カウンター1つにつき攻撃力+200。
   カウンター2つでモンスター1体を破壊 */
defineUnifiedCardV4('魔法の操り人形',[{
  key:'spell-activated-add-counter',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){ return v12SpellBy(ctx,'any'); },
  operation(ctx){ v12AddSpellCounter(ctx,null); },
  afterResolve(){}
},{
  key:'spend-two-counters-destroy',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){
    return v12SpellCounters(ctx.card)>=2&&API.fieldCards({zone:'mz'}).length>0;},
  operation(ctx){
    ensureCardUid(gameState,ctx.card);
    v49P1Open(ctx,{kind:'card',title:'魔法の操り人形：破壊するモンスター',
      candidates:API.fieldCards({zone:'mz'}),min:1,max:1},
      'p12act.spend-counters-destroy',
      {reason:'魔法の操り人形',spend:2,sourceUid:ctx.card.uid},false);},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true,timing:['mainPhase'],
    continuous:{scope:'self',from:['mz'],
      apply(card){ return {atk:v12SpellCounters(card)*200}; }}});

/* 魔法が発動する度にカウンター。任意の個数取り除き、
   取り除いた数×700以下の攻撃力の表側モンスター1体を破壊 */
defineUnifiedCardV4('ブラッド・マジシャン－煉獄の魔術師－',[{
  key:'spell-activated-add-counter',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){ return v12SpellBy(ctx,'any'); },
  operation(ctx){ v12AddSpellCounter(ctx,null); },
  afterResolve(){}
},{
  key:'spend-counters-destroy-by-atk',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){
    const n=v12SpellCounters(ctx.card);
    return n>=1&&v12BloodTargets(n).length>0;},
  operation(ctx){
    ensureCardUid(gameState,ctx.card);
    /* 取り除く数は最大まで使う形にして、対象はその範囲から選ぶ。 */
    const n=v12SpellCounters(ctx.card);
    v49P1Open(ctx,{kind:'card',
      title:'ブラッド・マジシャン：破壊するモンスター（魔力カウンター'+n+'つを取り除く）',
      candidates:v12BloodTargets(n),min:1,max:1},
      'p12act.spend-counters-destroy',
      {reason:'ブラッド・マジシャン－煉獄の魔術師－',spend:n,sourceUid:ctx.card.uid},false);},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true,timing:['mainPhase']});
function v12BloodTargets(n){
  const cap=Math.max(0,Number(n)||0)*700;
  return API.fieldCards({zone:'mz',
    filter:x=>x.card.face==='up'&&API.curAtk(x)<=cap});
}

/* 相手が魔法・罠を発動する度に、自分の「ナチュル」の攻撃力がエンドフェイズまで+500 */
defineUnifiedCardV4('ナチュル・トライアンフ',[{
  key:'opponent-activation-pump-naturia',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){
    return v12OtherActivation(ctx)&&ctx.event.player===ctx.opponent
      &&(API.isSpellActivation(ctx.event)||API.isTrapActivation(ctx.event))
      &&v12OwnNaturia(ctx).length>0;},
  operation(ctx){
    v12OwnNaturia(ctx).forEach(x=>API.modAtk(x,500,0,'endPhase','ナチュル・トライアンフ'));},
  afterResolve(){}
}],{type:'monster',priority:1});
function v12OwnNaturia(ctx){
  return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&String(x.db.n||'').indexOf('ナチュル')>=0});
}

/* =====================================================================
   2. カウンター罠の発動に反応する
   ===================================================================== */
/* カウンター罠が発動する度に1000回復。「天空の聖域」があれば相手のカード1枚を破壊 */
defineUnifiedCardV4('天空聖者メルティウス',[{
  key:'counter-trap-recover-and-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  targetRange:LOCATION.ONFIELD,targetSide:'opponent',speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){ return v12OtherActivation(ctx)&&API.isCounterTrapActivation(ctx.event); },
  operation(ctx){
    API.recoverLP(ctx.player,1000);
    if(!v12SanctuaryOnField()) return;
    const pool=API.fieldCards({player:ctx.opponent});
    if(!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'天空聖者メルティウス：破壊する相手のカード',
      candidates:pool,min:1,max:1},'p12act.destroy-one',
      {reason:'天空聖者メルティウス'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true});
function v12SanctuaryOnField(){
  return API.fieldCards({filter:x=>x.card.face==='up'
    &&sameCanonicalCardV4(x.db,dbOf({id:findCardIndex('天空の聖域')}))}).length>0;
}

/* カウンター罠が発動する度に、除外されている自分の天使族2体を手札に加える */
defineUnifiedCardV4('救済のレイヤード',[{
  key:'counter-trap-recover-fairies',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){
    return v12OtherActivation(ctx)&&API.isCounterTrapActivation(ctx.event)
      &&v12BanishedFairies(ctx).length>=2;},
  operation(ctx){
    const pool=v12BanishedFairies(ctx);
    v49P1Open(ctx,{kind:'card',title:'救済のレイヤード：手札に加える天使族2体',
      candidates:pool,min:2,max:2},'p12act.banish-to-hand',
      {reason:'救済のレイヤード'},false);},
  afterResolve(){}
}],{type:'monster',priority:1});
function v12BanishedFairies(ctx){
  return API.pileCards(ctx.player,'banish',x=>x.db.k==='m'&&x.db.ra==='天使');
}

/* カウンター罠が発動する度に「人造天使トークン」1体（v11 のトークン機構を使う） */
defineTokenSpecV11('人造天使トークン',{atk:300,def:300,lv:1,ra:'天使',at:'光',pos:'atk'});
defineUnifiedCardV4('人造天使',[{
  key:'counter-trap-make-token',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){
    return v12OtherActivation(ctx)&&API.isCounterTrapActivation(ctx.event)
      &&hasMonsterZoneSpace(ctx.player);},
  operation(ctx){
    API.createTokens(ctx.player,'人造天使トークン',1,
      {p:ctx.player,zone:'sz',index:0,card:ctx.card});},
  afterResolve(){}
}],{type:'trap',priority:2,includesSpecialSummon:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

/* =====================================================================
   3. 発動したカードそのものを狙う
   ===================================================================== */
/* 相手が速攻魔法を発動した時、フィールドのカード1枚を破壊する */
defineUnifiedCardV4('反魔鏡',[{
  key:'opponent-quick-spell-destroy-one',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.ONFIELD,targetSide:'both',speed:2,events:['onActivateSuccess'],
  condition(ctx){ return v12SpellBy(ctx,'opponent','quick')&&v12FieldAll().length>0; },
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'反魔鏡：破壊するカード',
      candidates:v12FieldAll(),min:1,max:1},'p12act.destroy-one',
      {reason:'反魔鏡'},true);},
  afterResolve(){}
}],{type:'trap',priority:2,targets:true});

/* 1ターンに1度、相手が罠を発動した時、その罠を破壊し800ダメージ */
defineUnifiedCardV4('トラップ・リアクター・RR',[{
  key:'opponent-trap-destroy-burn',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:2,
  events:['onActivateSuccess'],
  condition(ctx){ return v12TrapBy(ctx,'opponent')&&!!API.activationSource(ctx.event); },
  operation(ctx){
    const h=API.activationSource(ctx.event);
    if(h) API.destroy(h,'トラップ・リアクター・RR');
    API.damageLP(ctx.opponent,800);},
  afterResolve(){}
}],{type:'monster',priority:2,countLimit:1});

/* 1ターンに1度、相手が魔法を発動した時、その魔法を破壊し800ダメージ */
defineUnifiedCardV4('マジック・リアクター・AID',[{
  key:'opponent-spell-destroy-burn',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:2,
  events:['onActivateSuccess'],
  condition(ctx){ return v12SpellBy(ctx,'opponent')&&!!API.activationSource(ctx.event); },
  operation(ctx){
    const h=API.activationSource(ctx.event);
    if(h) API.destroy(h,'マジック・リアクター・AID');
    API.damageLP(ctx.opponent,800);},
  afterResolve(){}
}],{type:'monster',priority:2,countLimit:1});

/* 罠カードが発動した時、表側のこのカードを持ち主の手札に戻す */
defineUnifiedCardV4('ウィングド・ライノ',[{
  key:'trap-activated-self-bounce',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:2,
  events:['onActivateSuccess'],
  condition(ctx){
    const h=locateCardAnyV4(ctx.card);
    return v12TrapBy(ctx,'any')&&!!h&&h.zone==='mz'&&h.card.face==='up';},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.returnToHand(h,'ウィングド・ライノ');},
  afterResolve(){}
}],{type:'monster',priority:2});

/* 魔の取引・ナチュル・ロック・ジェット・ロイドなどは、
   決定論的ランダム / 手札からの誘発即時応答 / バトルステップの罠発動窓
   が別に要るため ENGINE_GAP のまま残す。
   王宮の陥落・魔力終了宣告・金属探知器・魔法探査の石版は、
   発動と効果をまとめて無効にする汎用の無効化層が必要。 */
