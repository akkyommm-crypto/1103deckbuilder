/* StatModifier recovery batch — System v14 の攻守修整で解消したカード。
   使う共通機構は API.setAtk / setDef / setBaseStats / addBaseStats /
   swapBaseStats / clearStatMods / baseAtk / baseDef と、
   v13 の効果無効・v12 の発動イベント・v7 の予約・既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v14IsNormalMonster(x){
  return !!(x&&x.db&&x.db.k==='m'&&!x.db.ex&&(x.db.st||[]).indexOf('通常')>=0
            &&!isTokenV11(x.card));
}
function v14IsSynchro(x){ return !!(x&&x.db&&(x.db.st||[]).indexOf('シンクロ')>=0); }
/* 自分フィールドの表側モンスター */
function v14OwnFaceUp(ctx,f){
  return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&(!f||f(x))});
}
/* このターンのエンドフェイズに破壊を予約する */
function v14ScheduleSelfDestroy(ctx,label){
  const h=locateCardAnyV4(ctx.card); if(!h) return;
  ensureCardUid(gameState,ctx.card);
  API.schedule({at:'endPhase',turns:0,player:ctx.player,
    handler:'v7.destroyUid',args:{uid:ctx.card.uid,reason:label},note:label});
}

/* ---- 選択の継続 --------------------------------------------------------- */
API.registerChoiceHandler('p14stat.set-atk-and-negate',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  const src=(args.sourceUid!=null)?findCardByUid(args.sourceUid):null;
  if(h){
    API.setAtk(h,Number(args.atk),'endPhase',args.reason);
    if(args.negate) API.negateEffectUntil(h,'endTurn',args.reason,src?src.card:null);
  }
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p14stat.swap-base',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h) API.swapBaseStats(h,'endPhase',args.reason);
  v49P1FinishSource(args);
});
/* 自分のモンスターの攻撃力を、相手モンスターの元々の攻撃力と同じにする */
API.registerChoiceHandler('p14stat.copy-base-atk',(answer,args)=>{
  const cards=v49P1ChoiceCards(answer);
  if(cards.length<2){ v49P1FinishSource(args); return; }
  const mine=locateCardAnyV4(cards[0].card), foe=locateCardAnyV4(cards[1].card);
  if(mine&&foe) API.setAtk(mine,API.baseAtk(foe),'endPhase',args.reason);
  v49P1FinishSource(args);
});
/* シンクロの攻撃力を0にし、その元々の攻撃力分だけ別のモンスターを上げる */
API.registerChoiceHandler('p14stat.synchro-gift',(answer,args)=>{
  const cards=v49P1ChoiceCards(answer);
  if(cards.length<2){ v49P1FinishSource(args); return; }
  const syn=locateCardAnyV4(cards[0].card), other=locateCardAnyV4(cards[1].card);
  if(syn&&other){
    const base=API.baseAtk(syn);
    API.setAtk(syn,0,'endPhase',args.reason);
    API.modAtk(other,base,0,'endPhase',args.reason);
  }
  v49P1FinishSource(args);
});

/* =====================================================================
   1. 自分自身の数値を変えるモンスター
   ===================================================================== */
/* 1ターンに1度、エンドフェイズ時まで攻撃力が元々の攻撃力の倍になる。
   使ったらエンドフェイズに自壊する。 */
defineUnifiedCardV4('カラテマン',[{
  key:'double-own-base-atk-then-selfdestroy',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  speed:1,events:['activate'],
  condition(ctx){ return gameState.phase==='main1'||gameState.phase==='main2'; },
  operation(ctx){
    const h=locateCardAnyV4(ctx.card); if(!h) return;
    API.setAtk(h,API.baseAtk(h)*2,'endPhase','カラテマン');
    v14ScheduleSelfDestroy(ctx,'カラテマン');},
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase']});

/* 魔法カードが発動する度に、元々の攻撃力と守備力を入れ替える */
defineUnifiedCardV4('ナチュル・ビートル',[{
  key:'spell-activated-swap-base',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onActivateSuccess'],forced:true,
  condition(ctx){
    const e=ctx.event;
    return !!(e&&ctx.card&&e.uid!==ctx.card.uid&&API.isSpellActivation(e));},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.swapBaseStats(h,'permanent','ナチュル・ビートル');},
  afterResolve(){}
}],{type:'monster',priority:1});

/* 光属性モンスターの攻撃を受けた時、守備力が半分になる */
defineUnifiedCardV4('闇の芸術家',[{
  key:'attacked-by-light-halve-def',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onAttackDeclare'],forced:true,
  condition(ctx){
    const b=(typeof currentBattleIdentityV6==='function')?currentBattleIdentityV6(gameState):null;
    if(!b||!ctx.card||ctx.card.uid==null) return false;
    if(b.defenderUid!==ctx.card.uid) return false;
    const atk=(b.attackerUid!=null)?findCardByUid(b.attackerUid):null;
    return !!(atk&&dbOf(atk.card).at==='光');},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.setDef(h,Math.floor(API.baseDef(h)/2),'permanent','闇の芸術家');},
  afterResolve(){}
}],{type:'monster',priority:1,passive:{onAttackDeclare:ctx=>ctx.zone==='mz'}});

/* 召喚・反転召喚に成功した時、元々の攻守は次の自分のターンのエンドフェイズ時まで
   半分になり、その後は倍になる */
API.registerScheduleHandler('v14.hourglassDouble',(args)=>{
  const h=(args&&args.uid!=null)?findCardByUid(args.uid):null;
  if(!h||h.zone!=='mz') return;
  API.clearStatMods(h,'勇気の砂時計（半分）');
  const db=dbOf(h.card);
  API.setBaseStats(h,(db.atk||0)*2,(db.def||0)*2,'permanent','勇気の砂時計（倍）');
});
defineUnifiedCardV4('勇気の砂時計',[{
  key:'summon-halve-base-then-double',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onNormalSummon','onFlip'],forced:true,
  condition(ctx){
    const e=ctx.event||{};
    return !!(ctx.card&&(e.card===ctx.card));},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card); if(!h) return;
    ensureCardUid(gameState,ctx.card);
    API.setBaseStats(h,Math.floor(API.baseAtk(h)/2),Math.floor(API.baseDef(h)/2),
      'permanent','勇気の砂時計（半分）');
    API.schedule({at:'endPhase',ownTurn:true,player:ctx.player,
      handler:'v14.hourglassDouble',args:{uid:ctx.card.uid},note:'勇気の砂時計'});},
  afterResolve(){}
}],{type:'monster',priority:1,
    passive:{onNormalSummon:ctx=>ctx.zone==='mz',onFlip:ctx=>ctx.zone==='mz'}});

/* 「もけもけ」がいる時、自分の天使族が破壊されたら「もけもけ」の攻撃力が3000になる */
defineUnifiedCardV4('怒れるもけもけ',[{
  key:'fairy-destroyed-pump-mokemoke',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,
  events:['onLeaveField'],
  condition(ctx){
    const e=ctx.event||{};
    if(e.byDestroy!==true||e.player!==ctx.player) return false;
    const h=API.leavingCardOf(e);
    if(!h||dbOf(h.card).k!=='m'||dbOf(h.card).ra!=='天使') return false;
    return v14Mokemoke(ctx).length>0;},
  operation(ctx){
    v14Mokemoke(ctx).forEach(x=>API.setAtk(x,3000,'endPhase','怒れるもけもけ'));},
  afterResolve(){}
}],{type:'trap',priority:2});
function v14Mokemoke(ctx){
  const moke=dbOf({id:findCardIndex('もけもけ')});
  return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&sameCanonicalCardV4(x.db,moke)});
}

/* =====================================================================
   2. 元々の数値をまとめて変える魔法
   ===================================================================== */
function v14DefineEnergySpell(name,level,amount){
  defineUnifiedCardV4(name,[{
    key:'boost-base-of-normal-monsters',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
    speed:1,events:['activate'],
    condition(ctx){ return v14NormalsOfLevel(ctx,level).length>0; },
    operation(ctx){
      v14NormalsOfLevel(ctx,level).forEach(x=>{
        API.addBaseStats(x,amount,amount,'permanent',name);
        ensureCardUid(gameState,x.card);
        API.schedule({at:'endPhase',turns:0,player:ctx.player,
          handler:'v7.destroyUid',args:{uid:x.card.uid,reason:name},note:name});
      });},
    afterResolve(){}
  }],{type:'spell',priority:1,destroysFieldV46:true});
}
function v14NormalsOfLevel(ctx,level){
  return v14OwnFaceUp(ctx,x=>v14IsNormalMonster(x)&&(x.db.lv||0)===level);
}
v14DefineEnergySpell('サウザンドエナジー',2,1000);
v14DefineEnergySpell('トライアングルパワー',1,2000);

/* =====================================================================
   3. 対象の数値を変えるカード
   ===================================================================== */
/* 「ナチュル」1体：エンドフェイズ時まで攻撃力3000、効果は無効 */
defineUnifiedCardV4('ガオドレイクのタテガミ',[{
  key:'naturia-set-3000-and-negate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){ return v14OwnNaturia(ctx).length>0; },
  operation(ctx){
    ensureCardUid(gameState,ctx.card);
    v49P1Open(ctx,{kind:'card',title:'ガオドレイクのタテガミ：対象の「ナチュル」',
      candidates:v14OwnNaturia(ctx),min:1,max:1},'p14stat.set-atk-and-negate',
      {reason:'ガオドレイクのタテガミ',atk:3000,negate:true,sourceUid:ctx.card.uid},true);},
  afterResolve(){}
}],{type:'spell',priority:1,targets:true});
function v14OwnNaturia(ctx){
  return v14OwnFaceUp(ctx,x=>String(x.db.n||'').indexOf('ナチュル')>=0);
}

/* 地属性モンスター1体の元々の攻守をエンドフェイズ時まで入れ替える。
   また1ターンに1度だけ自身を裏側守備表示にできる。 */
defineUnifiedCardV4('グレート・スピリット',[{
  key:'self-set-face-down',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,
  events:['activate'],
  condition(ctx){
    const h=locateCardAnyV4(ctx.card);
    return !!h&&h.zone==='mz'&&h.card.face==='up'
      &&(gameState.phase==='main1'||gameState.phase==='main2');},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) act({type:'FX_SET_STATE',player:h.p,zone:h.zone,index:h.index,
               face:'down',pos:'def',reason:'グレート・スピリット'});},
  afterResolve(){}
},{
  key:'flip-summon-swap-earth-base',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['onFlip'],
  condition(ctx){
    return !!(ctx.event&&ctx.event.card===ctx.card&&ctx.event.flipSummon)
      &&v14EarthMonsters().length>0;},
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'グレート・スピリット：元々の攻守を入れ替える地属性',
      candidates:v14EarthMonsters(),min:1,max:1},'p14stat.swap-base',
      {reason:'グレート・スピリット'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:{n:1,effects:['self-set-face-down']},targets:true,timing:['mainPhase'],
    passive:{onFlip:ctx=>ctx.zone==='mz'}});
function v14EarthMonsters(){
  return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&x.db.at==='地'});
}

/* 自分と相手のモンスターを1体ずつ選択し、自分のモンスターの攻撃力を
   相手モンスターの元々の攻撃力と同じにする */
defineUnifiedCardV4('極星宝ブリージンガ・メン',[{
  key:'copy-opponent-base-atk',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){
    return v14OwnFaceUp(ctx).length>0
      &&API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
  operation(ctx){
    const mine=v14OwnFaceUp(ctx);
    const foe=API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'});
    v49P1Open(ctx,{kind:'card',
      title:'極星宝ブリージンガ・メン：自分のモンスター→相手のモンスターの順に選択',
      candidates:mine.concat(foe),min:2,max:2},'p14stat.copy-base-atk',
      {reason:'極星宝ブリージンガ・メン'},true);},
  afterResolve(){}
}],{type:'spell',priority:1,targets:true});

/* シンクロ1体の攻撃力を0にし、その元々の攻撃力分だけ別の1体を強化する */
defineUnifiedCardV4('シンクロ・ギフト',[{
  key:'synchro-atk-to-other',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){
    return v14OwnFaceUp(ctx,v14IsSynchro).length>0
      &&v14OwnFaceUp(ctx,x=>!v14IsSynchro(x)).length>0;},
  operation(ctx){
    const syn=v14OwnFaceUp(ctx,v14IsSynchro);
    const other=v14OwnFaceUp(ctx,x=>!v14IsSynchro(x));
    v49P1Open(ctx,{kind:'card',
      title:'シンクロ・ギフト：シンクロ→強化するモンスターの順に選択',
      candidates:syn.concat(other),min:2,max:2},'p14stat.synchro-gift',
      {reason:'シンクロ・ギフト'},true);},
  afterResolve(){}
}],{type:'spell',priority:1,targets:true});

/* きまぐれの女神・バイス・ドラゴン・ミスト・コンドル・グリード・クエーサー・
   銀幕の鏡壁などは、決定論的コイン / 手札からの特殊召喚手順 /
   レベル変動 / 攻撃モンスター限定の継続的な半減 が別に要るため
   ENGINE_GAP のまま残す。 */
