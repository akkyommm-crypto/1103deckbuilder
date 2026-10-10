/* Counter recovery batch — System v22 で解消したカード。
   使う共通機構は counterCapable / counterUnits / removeCounterSpread /
   placeCounterSpread / onCounterPlaced / onCounterRemoved / counterMaxV22（v22）、
   既存の COUNTER_ADD / COUNTER_REMOVE / countCounter、
   P3 provenance、P4 setcode、v49 P1 の選択のみ。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v22At(card){ return locateCardAnyV4(card); }
/* 選択の答えを uid の並びへ。同じカードを複数回選んだ順もそのまま残る。 */
function v22AnswerUids(answer){
  return v49P1ChoiceCards(answer).map(x=>x.card&&x.card.uid).filter(u=>u!=null);
}
/* 「エーリアン」と名のついたモンスター */
function v22IsAlien(db){ return isSetCardV4(db, SETCODE.ALIEN); }

/* ---- 選択の継続 --------------------------------------------------------- */
/* 選んだカウンターを取り除いてから、続きの処理を行う */
API.registerChoiceHandler('p22cnt.pay-then-destroy-all',(answer,args)=>{
  API.removeCounterSpread(v22AnswerUids(answer), args.kind, args.reason);
  API.fieldCards({player:args.foe,zone:'mz'}).slice().forEach(t=>API.destroy(t,args.reason));
  API.fieldCards({player:args.foe,zone:'sz'}).slice().forEach(t=>API.destroy(t,args.reason));
  API.fieldCards({player:args.foe,zone:'field'}).slice().forEach(t=>API.destroy(t,args.reason));
  v49P1FinishSource(args);
});
/* 選んだカウンターを取り除いてから、墓地のエーリアンを特殊召喚する */
API.registerChoiceHandler('p22cnt.pay-then-revive-alien',(answer,args)=>{
  API.removeCounterSpread(v22AnswerUids(answer), args.kind, args.reason);
  const pool=API.pileCards(args.player,'grave',x=>x.db.k==='m'&&v22IsAlien(x.db));
  if(!pool.length||!hasMonsterZoneSpace(args.player)){ v49P1FinishSource(args); return; }
  v49P1Open({player:args.player,card:null},
    {kind:'card',title:args.reason+'：特殊召喚するエーリアン',candidates:pool,min:1,max:1},
    'p1cards.special-summon',{from:'grave',pos:'atk',reason:args.reason},false);
  v49P1FinishSource(args);
});
/* 選んだカードへ1つずつカウンターを置く */
API.registerChoiceHandler('p22cnt.place-spread',(answer,args)=>{
  API.placeCounterSpread(v22AnswerUids(answer), args.kind, args.reason);
  v49P1FinishSource(args);
});
/* 魔力カウンターを置ける1枚を選んで1つ置く */
API.registerChoiceHandler('p22cnt.place-one',(answer,args)=>{
  const uid=v22AnswerUids(answer)[0];
  if(uid!=null) API.placeCounterSpread([uid], args.kind, args.reason);
  v49P1FinishSource(args);
});
/* 漆黒のパワーストーン：自身から1つ取り除いて対象へ1つ置く */
API.registerChoiceHandler('p22cnt.transfer-one',(answer,args)=>{
  const uid=v22AnswerUids(answer)[0];
  if(uid==null){ v49P1FinishSource(args); return; }
  const me=findCardByUid(args.selfUid);
  if(me) API.removeCounter(me,'魔力',1);
  API.placeCounterSpread([uid],'魔力',args.reason);
  v49P1FinishSource(args);
});

/* =====================================================================
   1. 魔力カウンターの capability を使うカード
   ===================================================================== */
/* 自分フィールド上の魔力カウンターを10個取り除いて発動。相手の場を全て破壊 */
defineUnifiedCardV4('メガトン魔導キャノン',[{
  key:'pay-ten-spell-counters',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:1,events:['activate'],
  condition(ctx){ return API.counterTotal(ctx.player,'魔力')>=10; },
  operation(ctx){
    const units=API.counterUnits(ctx.player,'魔力');
    if(units.length<10) return;
    v49P1Open(ctx,{kind:'card',title:'メガトン魔導キャノン：取り除く魔力カウンター10個',
      candidates:units,min:10,max:10},
      'p22cnt.pay-then-destroy-all',
      {kind:'魔力',foe:ctx.opponent,reason:'メガトン魔導キャノン'},false);},
  afterResolve(){}
}],{type:'spell',priority:1,timing:['mainPhase']});

/* リバース：魔力カウンターを置けるカード全てに1つ置く */
defineUnifiedCardV4('魔草 マンドラゴラ',[{
  key:'place-on-all-capable',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onFlip'],
  condition(ctx){ return ctx.zone==='mz'&&API.counterCapableCards(null,'魔力').length>0; },
  operation(ctx){
    const uids=API.counterCapableCards(null,'魔力')
      .map(x=>ensureCardUid(gameState,x.card));
    if(uids.length) API.placeCounterSpread(uids,'魔力','魔草 マンドラゴラ');},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onFlip(ctx){return ctx.zone==='mz';}}});

/* 1ターンに1度、表側攻撃表示のこのカードを守備表示にし、
   魔力カウンターを置けるカード1枚に魔力カウンターを1つ置ける */
defineUnifiedCardV4('黒魔力の精製者',[{
  key:'turn-to-defense-place-counter',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  speed:1,events:['activate'],
  condition(ctx){
    const h=v22At(ctx.card);
    if(!h||h.zone!=='mz'||h.card.face!=='up'||h.card.pos!=='atk'){
      ctx.reason='表側攻撃表示である必要があります'; return false; }
    if(ctx.card.v22RefinerTurn===gameState.turn){
      ctx.reason='このターンは既に使用しています'; return false; }
    return API.counterCapableCards(ctx.player,'魔力').length>0;},
  operation(ctx){
    const h=v22At(ctx.card);
    if(!h) return;
    API.changePosition(h,'def','黒魔力の精製者');
    API.setCardFlag(v22At(ctx.card),'v22RefinerTurn',gameState.turn,'黒魔力の精製者');
    const pool=API.counterCapableCards(ctx.player,'魔力');
    if(!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'黒魔力の精製者：魔力カウンターを置くカード',
      candidates:pool,min:1,max:1},
      'p22cnt.place-one',{kind:'魔力',reason:'黒魔力の精製者'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,timing:['mainPhase']});

/* 発動時に自身へ魔力カウンターを3つ置く。
   ①自分ターンに1度、他の置けるカード1枚へ1つ移す。
   ②自身の魔力カウンターが全て取り除かれた場合、このカードは破壊される */
defineUnifiedCardV4('漆黒のパワーストーン',[
  {
    key:'activate-with-three',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
    speed:2,events:['activate'],
    condition(){ return true; },
    operation(ctx){
      const h=v22At(ctx.card);
      if(h) API.addCounter(h,'魔力',3);},
    afterResolve(){}
  },
  {
    key:'transfer-one-counter',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,
    speed:1,events:['activate'],
    condition(ctx){
      const h=v22At(ctx.card);
      if(!h||h.zone!=='sz'||h.card.face!=='up'){
        ctx.reason='表側表示で存在する必要があります'; return false; }
      if(gameState.activePlayer!==ctx.player){
        ctx.reason='自分のターンにのみ使用できます'; return false; }
      if(ctx.card.v22PowerStoneTurn===gameState.turn){
        ctx.reason='このターンは既に使用しています'; return false; }
      if(API.countCounter(h,'魔力')<1){
        ctx.reason='このカードに魔力カウンターがありません'; return false; }
      return v22StoneTargets(ctx).length>0;},
    operation(ctx){
      ensureCardUid(gameState,ctx.card);
      API.setCardFlag(v22At(ctx.card),'v22PowerStoneTurn',gameState.turn,'漆黒のパワーストーン');
      const pool=v22StoneTargets(ctx);
      if(!pool.length) return;
      v49P1Open(ctx,{kind:'card',title:'漆黒のパワーストーン：魔力カウンターを移すカード',
        candidates:pool,min:1,max:1},
        'p22cnt.transfer-one',
        {selfUid:ctx.card.uid,reason:'漆黒のパワーストーン'},false);},
    afterResolve(){}
  },
  {
    key:'self-destroy-when-empty',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,
    speed:1,events:['onCounterRemoved'],
    condition(ctx){
      const h=v22At(ctx.card), e=ctx.event||{};
      if(!h||h.zone!=='sz') return false;
      if(e.uid!==ctx.card.uid||e.kind!=='魔力') return false;
      return API.countCounter(h,'魔力')===0;},
    operation(ctx){
      const h=v22At(ctx.card);
      if(h) API.destroy(h,'漆黒のパワーストーン');},
    afterResolve(){}
  }
],{type:'trap',subtype:'永続',priority:2,forced:true,timing:['mainPhase','free'],
   counterCapableV22:{'魔力':true},
   passive:{onCounterRemoved(ctx){return ctx.zone==='sz';}}});
function v22StoneTargets(ctx){
  return API.counterCapableCards(null,'魔力').filter(x=>x.card!==ctx.card);
}

/* =====================================================================
   2. カウンターの増減イベントを使うカード
   ===================================================================== */
/* フィールドのAカウンターが取り除かれる度に、このカードにAカウンターを1つ置く。
   このカードが破壊された時、乗っていた全てのAカウンターを表側モンスターへ置く */
defineUnifiedCardV4('「A」細胞培養装置',[
  {
    key:'gain-on-any-a-counter-removed',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,
    speed:1,events:['onCounterRemoved'],
    condition(ctx){
      const h=v22At(ctx.card), e=ctx.event||{};
      return !!h&&h.zone==='sz'&&h.card.face==='up'&&e.kind==='A'&&e.uid!==ctx.card.uid;},
    operation(ctx){
      const h=v22At(ctx.card);
      if(h) API.addCounter(h,'A',1);},
    afterResolve(){}
  },
  {
    key:'scatter-on-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,
    speed:1,events:['onDestroy'],
    condition(ctx){
      const g=ctx.card&&ctx.card.graveInfo;
      if(!g||!g.byDestroy||g.from!=='sz') return false;
      return v22StoredACount(ctx.card)>0&&v22FaceUpMonsters().length>0;},
    operation(ctx){
      const n=v22StoredACount(ctx.card);
      const pool=v22FaceUpMonsters();
      if(!n||!pool.length) return;
      /* 破壊された時点で乗っていた数だけ、表側モンスターへ分配する。 */
      v49P1Open(ctx,{kind:'card',title:'「A」細胞培養装置：Aカウンターを置くモンスター',
        candidates:v22RepeatCandidates(pool,n),min:n,max:n},
        'p22cnt.place-spread',{kind:'A',reason:'「A」細胞培養装置'},false);},
    afterResolve(){}
  }
],{type:'spell',subtype:'永続',priority:1,forced:true,
   counterCapableV22:{'A':true},activateFrom:['grave'],
   passive:{onCounterRemoved(ctx){return ctx.zone==='sz';},
            onDestroy(ctx){return ctx.zone==='grave';}}});
/* 墓地へ行く直前に乗っていたAカウンターの数。counters は領域ローカルで
   消えるので、破壊時に控えた数を graveInfo から読む。 */
function v22StoredACount(card){
  const g=card&&card.graveInfo;
  const c=g&&g.countersV22;
  return (c&&typeof c['A']==='number')?c['A']:0;
}
function v22FaceUpMonsters(){
  return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
}
/* 同じカードを複数回選べるように、候補を n 回並べる */
function v22RepeatCandidates(pool, n){
  const out=[];
  for(let i=0;i<n;i++) pool.forEach((x,j)=>out.push(Object.assign({},x,{key:'r'+i+'_'+j})));
  return out;
}

/* 「エーリアン」が破壊される度にAカウンターを1つ置く。
   1ターンに1度、フィールドのAカウンター2つを取り除いて墓地のエーリアンを特殊召喚 */
defineUnifiedCardV4('古代遺跡コードA',[
  {
    key:'gain-on-alien-destroyed',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,
    speed:1,events:['onDestroy'],
    condition(ctx){
      const h=v22At(ctx.card), e=ctx.event||{};
      if(!h||h.zone!=='sz'||h.card.face!=='up') return false;
      const c=e.card;
      return !!c&&dbOf(c).k==='m'&&v22IsAlien(dbOf(c));},
    operation(ctx){
      const h=v22At(ctx.card);
      if(h) API.addCounter(h,'A',1);},
    afterResolve(){}
  },
  {
    key:'pay-two-a-counters-revive',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,
    speed:1,events:['activate'],
    condition(ctx){
      const h=v22At(ctx.card);
      if(!h||h.zone!=='sz'||h.card.face!=='up'){
        ctx.reason='表側表示で存在する必要があります'; return false; }
      if(ctx.card.v22CodeATurn===gameState.turn){
        ctx.reason='このターンは既に使用しています'; return false; }
      if(API.counterTotal(null,'A')<2){
        ctx.reason='フィールドのAカウンターが足りません'; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){
        ctx.reason='モンスターゾーンが一杯です'; return false; }
      return API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&v22IsAlien(x.db)).length>0;},
    operation(ctx){
      ensureCardUid(gameState,ctx.card);
      API.setCardFlag(v22At(ctx.card),'v22CodeATurn',gameState.turn,'古代遺跡コードA');
      const units=API.counterUnits(null,'A');
      if(units.length<2) return;
      v49P1Open(ctx,{kind:'card',title:'古代遺跡コードA：取り除くAカウンター2つ',
        candidates:units,min:2,max:2},
        'p22cnt.pay-then-revive-alien',
        {kind:'A',player:ctx.player,reason:'古代遺跡コードA'},false);},
    afterResolve(){}
  }
],{type:'spell',subtype:'永続',priority:1,timing:['mainPhase'],
   counterCapableV22:{'A':true},
   passive:{onDestroy(ctx){return ctx.zone==='sz';}}});

/* 自分の「エーリアン」1体を選択して発動。そのモンスターを破壊し、
   そのレベルの数だけ相手の表側モンスターへAカウンターを置く */
defineUnifiedCardV4('「A」細胞散布爆弾',[{
  key:'destroy-alien-scatter-a',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:2,events:['activate'],
  condition(ctx){
    return v22OwnAliens(ctx.player).length>0
      &&API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
  target(ctx,done){
    API.selectCard('「A」細胞散布爆弾：破壊するエーリアン',v22OwnAliens(ctx.player),
      t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(!h) return;
    /* 破壊する前にレベルを控える。破壊後は場を離れて読めない。 */
    const lv=curLV(h.card)||0;
    API.destroy(h,'「A」細胞散布爆弾');
    if(lv<=0) return;
    const pool=API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'});
    if(!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'「A」細胞散布爆弾：Aカウンターを置くモンスター',
      candidates:v22RepeatCandidates(pool,lv),min:lv,max:lv},
      'p22cnt.place-spread',{kind:'A',reason:'「A」細胞散布爆弾'},false);},
  afterResolve(){}
}],{type:'spell',subtype:'速攻',priority:2,targets:true});
function v22OwnAliens(p){
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>x.card.face==='up'&&v22IsAlien(x.db)});
}

/* =====================================================================
   3. 既存機構だけでも書けるが、同じカウンター族なので併せて実装
   ===================================================================== */
/* このカードがある限り、自分以外のAカウンターが乗った効果モンスターの効果は無効 */
defineUnifiedCardV4('エーリアン・マーズ',[],{type:'monster',priority:1,
  continuous:{scope:'allMonsters',from:['mz'],apply(){return null;},
    negateEffect(card,self){
      if(!card||card===self) return false;
      if(sameCanonicalCardV4(dbOf(card),dbOf(self))) return false;
      const db=dbOf(card);
      if(db.k!=='m'||(db.st||[]).indexOf('効果')<0) return false;
      const h=locateCardAnyV4(card);
      if(!h||h.zone!=='mz') return false;
      return ((card.counters&&Number(card.counters['A']))||0)>0;}}});

/* 自分のモンスターが攻撃宣言をする度に雷カウンターを1つ置く。
   4つ以上乗ったこのカードを墓地へ送り、相手モンスターを全て破壊 */
defineUnifiedCardV4('サンダー・ボトル',[
  {
    key:'gain-on-own-attack',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,
    speed:1,events:['onAttackDeclare'],
    condition(ctx){
      const h=v22At(ctx.card), e=ctx.event||{};
      return !!h&&h.zone==='sz'&&h.card.face==='up'&&e.player===ctx.player;},
    operation(ctx){
      const h=v22At(ctx.card);
      if(h) API.addCounter(h,'雷',1);},
    afterResolve(){}
  },
  {
    key:'send-self-destroy-all',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,
    speed:1,events:['activate'],
    condition(ctx){
      const h=v22At(ctx.card);
      if(!h||h.zone!=='sz'||h.card.face!=='up'){
        ctx.reason='表側表示で存在する必要があります'; return false; }
      if(API.countCounter(h,'雷')<4){
        ctx.reason='雷カウンターが4つ以上必要です'; return false; }
      return true;},
    cost(ctx,done){
      const h=v22At(ctx.card);
      if(!h||API.countCounter(h,'雷')<4){ done(false); return; }
      API.sendToGrave(h,'サンダー・ボトル（コスト）');
      done(true);},
    operation(ctx){
      API.fieldCards({player:ctx.opponent,zone:'mz'}).slice()
        .forEach(t=>API.destroy(t,'サンダー・ボトル'));},
    afterResolve(){}
  }
],{type:'trap',subtype:'永続',priority:2,forced:true,timing:['mainPhase','free'],
   counterCapableV22:{'雷':true},
   passive:{onAttackDeclare(ctx){return ctx.zone==='sz'&&ctx.card.face==='up';}}});

/* エーリアン・ハンター・ヴェノム系・六武院・ドングリス・ワーム・イリダン・
   種子弾丸・強欲なカケラ・剣闘獣の檻・伝説の爆炎使い・バルーン・リザード・
   惑星汚染ウイルス・アイス・ブリザード・マスター・亜空間ジャンプ装置・
   D・クロックン は、戦闘破壊時のカウンター保持、「ヴェノム」metadata、
   同時召喚の1体ごとのイベント、セット・相手特殊召喚・植物族召喚などの
   個別イベント、3ターンの窓、専用の召喚手順が別に要る。
   いずれもカウンター側の不足ではないので ENGINE_GAP のまま残す。 */
