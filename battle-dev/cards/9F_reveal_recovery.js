/* Reveal / AtomicDeck recovery batch — System v20 で解消したカード。
   使う共通機構は API.inspect / reveal / revealObligation / deckTop /
   orderToDeck / shuffleFaceDown（v20）、v49 P1 の選択、既存APIのみ。

   1103 の言い回しの区別をそのまま実装に写す。
     「確認する」… 自分だけが見る（inspect）。相手側 state には残さない。
     「めくる」「公開する」「見せる」… 見せた事自体が状態（reveal）。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
/* セットされたカード（裏側の魔法・罠とフィールド、裏側モンスター）のハンドル */
function v20SetCards(player){
  const out=[];
  ['sz','field','mz'].forEach(z=>{
    API.fieldCards({player,zone:z}).forEach(h=>{ if(h&&h.card&&h.card.face==='down') out.push(h); });
  });
  return out;
}
/* v49 P1 の答えは選んだ順を保つ。その順のまま uid 列にする。 */
function v20AnswerUids(answer){
  return v49P1ChoiceCards(answer).map(x=>x.card&&x.card.uid).filter(u=>u!=null);
}

/* ---- 選択の継続 --------------------------------------------------------- */
/* 確認したカードを好きな順番でデッキの上に戻す */
API.registerChoiceHandler('p20rev.order-top',(answer,args)=>{
  API.orderToDeck(args.deckOwner, v20AnswerUids(answer), false, args.reason);
  v49P1FinishSource(args);
});
/* 1枚をデッキの一番下へ、残りを好きな順番で上へ */
API.registerChoiceHandler('p20rev.bottom-then-order',(answer,args)=>{
  const bottom=v20AnswerUids(answer)[0];
  if(bottom!=null) API.orderToDeck(args.deckOwner,[bottom],true,args.reason);
  const rest=(args.uids||[]).filter(u=>u!==bottom);
  if(!rest.length){ v49P1FinishSource(args); return; }
  const cards=rest.map(u=>findCardByUid(u)).filter(Boolean);
  if(cards.length<2){ API.orderToDeck(args.deckOwner,rest,false,args.reason); v49P1FinishSource(args); return; }
  v49P1Open({player:args.player,card:null},
    {kind:'card',title:args.reason+'：デッキの上に戻す順番',candidates:cards,
     min:cards.length,max:cards.length},
    'p20rev.order-top',{deckOwner:args.deckOwner,reason:args.reason,
                        sourceUid:(args.sourceUid!=null)?args.sourceUid:null},false);
  if(args.sourceUid!=null) v49P1FinishSource(args);
});
/* 儀式カードを1枚だけ相手に見せて手札に加え、残りを好きな順番で戻す */
API.registerChoiceHandler('p20rev.ritual-to-hand',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  let taken=null;
  if(picked&&picked.card){
    const h=locateCardAnyV4(picked.card);
    if(h&&h.zone==='deck'){
      taken=h.card.uid;
      /* 「相手に見せて」手札に加える。見せた事は状態として残す。 */
      API.reveal({player:args.player,audience:'both',cards:[h],
                  label:args.reason,until:'permanent'});
      API.deckToHand(args.player,h.index,args.reason);
    }
  }
  const rest=(args.uids||[]).filter(u=>u!==taken);
  const cards=rest.map(u=>findCardByUid(u)).filter(h=>h&&h.zone==='deck');
  if(!cards.length){ v49P1FinishSource(args); return; }
  v49P1Open({player:args.player,card:null},
    {kind:'card',title:args.reason+'：デッキの上に戻す順番',candidates:cards,
     min:cards.length,max:cards.length},
    'p20rev.order-top',{deckOwner:args.player,reason:args.reason},false);
  v49P1FinishSource(args);
});
/* 相手がデッキから昆虫族1体を選び、シャッフルの後デッキトップへ置く */
API.registerChoiceHandler('p20rev.opponent-topdeck',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const uid=picked&&picked.card&&picked.card.uid;
  API.shuffle(args.deckOwner);
  if(uid!=null) API.orderToDeck(args.deckOwner,[uid],false,args.reason);
  v49P1FinishSource(args);
});

/* =====================================================================
   1. 確認するだけのカード（自分だけが情報を得る）
   ===================================================================== */
/* 1000LP払って発動。相手フィールドにセットされたカードを全て確認する */
defineUnifiedCardV4('旧神の印',[{
  key:'inspect-opponent-set',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:1,events:['activate'],
  condition(ctx){ return API.me(ctx).lp>1000&&v20SetCards(ctx.opponent).length>0; },
  cost(ctx,done){
    if(API.me(ctx).lp<=1000){ done(false); return; }
    API.payCost(ctx.player,1000); done(true);},
  operation(ctx){ API.inspect(ctx.player,v20SetCards(ctx.opponent),'旧神の印'); },
  afterResolve(){}
}],{type:'spell',priority:1,timing:['mainPhase']});

/* 500LP払う。相手の手札と相手のセットカードを全て確認する */
defineUnifiedCardV4('マインド・ハック',[{
  key:'inspect-opponent-hand-and-set',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['activate'],
  condition(ctx){ return API.me(ctx).lp>500; },
  cost(ctx,done){
    if(API.me(ctx).lp<=500){ done(false); return; }
    API.payCost(ctx.player,500); done(true);},
  operation(ctx){
    const hand=API.pileCards(ctx.opponent,'hand');
    API.inspect(ctx.player,hand.concat(v20SetCards(ctx.opponent)),'マインド・ハック');},
  afterResolve(){}
}],{type:'trap',priority:2});

/* リバース：フィールドにセットされたカードを全て確認する */
defineUnifiedCardV4('厳格な老魔術師',[{
  key:'inspect-all-set',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onFlip'],
  condition(ctx){ return ctx.zone==='mz'; },
  operation(ctx){
    API.inspect(ctx.player,v20SetCards(0).concat(v20SetCards(1)),'厳格な老魔術師');},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onFlip(ctx){return ctx.zone==='mz';}}});

/* リバース：自分のデッキの上から5枚まで確認し、好きな順番でデッキの上に戻す */
defineUnifiedCardV4('大王目玉',[{
  key:'inspect-top-five-reorder',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onFlip'],
  condition(ctx){ return ctx.zone==='mz'&&API.me(ctx).deck.length>0; },
  operation(ctx){
    const top=API.deckTop(ctx.player,5);
    if(!top.length) return;
    API.inspect(ctx.player,top,'大王目玉');
    if(top.length<2) return;
    v49P1Open(ctx,{kind:'card',title:'大王目玉：デッキの上に戻す順番',
      candidates:top,min:top.length,max:top.length},
      'p20rev.order-top',{deckOwner:ctx.player,reason:'大王目玉'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onFlip(ctx){return ctx.zone==='mz';}}});

/* =====================================================================
   2. めくる（公開）カード
   ===================================================================== */
/* 相手のデッキの上から3枚めくる。1枚を一番下へ、残りを好きな順番で上へ */
defineUnifiedCardV4('盗み見ゴブリン',[{
  key:'peek-opponent-top-three',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:1,events:['activate'],
  condition(ctx){ return gameState.players[ctx.opponent].deck.length>0; },
  operation(ctx){
    const top=API.deckTop(ctx.opponent,3);
    if(!top.length) return;
    /* 「めくる」なのでお互いが見る。解決の間だけの公開。 */
    API.reveal({player:ctx.opponent,audience:'both',cards:top,
                label:'盗み見ゴブリン',until:'resolution'});
    const uids=top.map(h=>h.card.uid);
    if(top.length===1){ API.orderToDeck(ctx.opponent,uids,true,'盗み見ゴブリン'); return; }
    v49P1Open(ctx,{kind:'card',title:'盗み見ゴブリン：デッキの一番下に戻す1枚',
      candidates:top,min:1,max:1},
      'p20rev.bottom-then-order',
      {deckOwner:ctx.opponent,uids,reason:'盗み見ゴブリン'},false);},
  afterResolve(){}
}],{type:'spell',priority:1,timing:['mainPhase']});

/* 召喚成功時：デッキの上から3枚確認し、儀式カード1枚を見せて手札へ。残りを好きな順で戻す */
defineUnifiedCardV4('リチュア・チェイン',[{
  key:'inspect-three-take-ritual',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onNormalSummon'],
  condition(ctx){ return ctx.zone==='mz'&&API.me(ctx).deck.length>0; },
  operation(ctx){
    const top=API.deckTop(ctx.player,3);
    if(!top.length) return;
    const seen=API.inspect(ctx.player,top,'リチュア・チェイン');
    const uids=top.map(h=>h.card.uid);
    const ritual=inspectFilterV20(seen,h=>{
      const db=h.db||{};
      if(db.k==='m') return (db.st||[]).indexOf('儀式')>=0;
      return db.k==='s'&&db.sub==='儀式';
    });
    if(!ritual.length){
      if(uids.length>1)
        v49P1Open(ctx,{kind:'card',title:'リチュア・チェイン：デッキの上に戻す順番',
          candidates:top,min:uids.length,max:uids.length},
          'p20rev.order-top',{deckOwner:ctx.player,reason:'リチュア・チェイン'},false);
      return;
    }
    v49P1Open(ctx,{kind:'card',title:'リチュア・チェイン：相手に見せて手札に加える1枚',
      candidates:ritual,min:0,max:1},
      'p20rev.ritual-to-hand',{uids,reason:'リチュア・チェイン'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,
    passive:{onNormalSummon(ctx){return ctx.zone==='mz';}}});

/* リバース：セットされていればめくって確認し、罠カードだった場合だけ破壊する */
function v20DefineNinjaReveal(name, wantKind, jpKind){
  defineUnifiedCardV4(name,[{
    key:'flip-reveal-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
    targetRange:LOCATION.SZONE,targetSide:'both',speed:1,events:['onFlip'],
    condition(ctx){ return ctx.zone==='mz'&&v20NinjaTargets(wantKind).length>0; },
    target(ctx,done){
      API.selectCard(name+'：対象にする魔法・罠',v20NinjaTargets(wantKind),t=>done([t]));},
    operation(ctx){
      const t=ctx.selectedTargets&&ctx.selectedTargets[0];
      const h=t&&resolveTarget(t);
      if(!h||!h.card) return;
      /* セットされている場合だけ「めくって確認する」。中身が違えば元に戻す。 */
      if(h.card.face==='down')
        API.reveal({player:h.p,audience:'both',cards:[h],label:name,until:'resolution'});
      if((h.db||dbOf(h.card)).k===wantKind) API.destroy(h,name);
      else API.log(`${name}：${jpKind}カードではなかったので元に戻す`);},
    afterResolve(){}
  }],{type:'monster',priority:1,targets:true,
      passive:{onFlip(ctx){return ctx.zone==='mz';}}});
}
/* 表側の該当種類のカード、またはセットされた魔法・罠 */
function v20NinjaTargets(wantKind){
  const out=[];
  [0,1].forEach(p=>{
    ['sz','field'].forEach(z=>{
      API.fieldCards({player:p,zone:z}).forEach(h=>{
        if(!h||!h.card) return;
        if(h.card.face==='down'){ out.push(h); return; }
        if((h.db||dbOf(h.card)).k===wantKind) out.push(h);
      });
    });
  });
  return out;
}
v20DefineNinjaReveal('赤い忍者','t','罠');
v20DefineNinjaReveal('青い忍者','s','魔法');

/* =====================================================================
   3. 公開し続けるカード
   ===================================================================== */
/* このカードがある限り相手は手札を公開し続ける。
   相手スタンバイ時に相手の手札に魔法があれば相手は1000回復する */
defineUnifiedCardV4('真実の眼',[
  {
    key:'keep-opponent-hand-revealed',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
    speed:2,events:['activate'],
    condition(){ return true; },
    operation(ctx){
      ensureCardUid(gameState,ctx.card);
      API.reveal({player:ctx.opponent,audience:'both',zone:'hand',
        label:'真実の眼',until:'permanent',sourceUid:ctx.card.uid});},
    afterResolve(){}
  },
  {
    key:'opponent-standby-heal',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,
    speed:1,events:['onStandbyPhase'],
    condition(ctx){
      return ctx.zone==='sz'&&ctx.card.face==='up'
        &&gameState.activePlayer===ctx.opponent
        &&API.pileCards(ctx.opponent,'hand').some(h=>(h.db||{}).k==='s');},
    operation(ctx){ API.recoverLP(ctx.opponent,1000); },
    afterResolve(){}
  }
],{type:'trap',subtype:'永続',priority:2,forced:true,
   passive:{onStandbyPhase(ctx){return ctx.zone==='sz'&&ctx.card.face==='up';}}});

/* 相手の2回目のエンドフェイズまで、相手はドローしたカードを公開する */
defineUnifiedCardV4('ピケルの読心術',[{
  key:'opponent-draw-reveal',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['activate'],
  condition(){ return true; },
  operation(ctx){
    /* 公開義務そのものを記録する。発動したこのカードが墓地へ行っても続く。 */
    API.reveal({player:ctx.opponent,audience:'both',on:'draw',
      label:'ピケルの読心術',until:'endPhaseCount',remaining:2,endPhaseOf:ctx.opponent});},
  afterResolve(){}
}],{type:'trap',priority:2});

/* =====================================================================
   4. デッキ・場を原子的に並べ替えるカード
   ===================================================================== */
/* 300LP払って自分の裏側守備モンスターをシャッフルして並べ替える。1ターンに1度 */
defineUnifiedCardV4('うごめく影',[{
  key:'shuffle-own-facedown',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,
  speed:1,events:['activate'],
  condition(ctx){
    if(ctx.card.v20MovingShadowTurn===gameState.turn){
      ctx.reason='このターンは既に使用しています'; return false; }
    if(API.me(ctx).lp<=300){ ctx.reason='ライフポイントが足りません'; return false; }
    if(API.fieldCards({player:ctx.player,zone:'mz'}).filter(h=>h.card.face==='down').length<2){
      ctx.reason='裏側守備表示モンスターが2体以上必要です'; return false; }
    return true;},
  cost(ctx,done){
    if(API.me(ctx).lp<=300){ done(false); return; }
    API.payCost(ctx.player,300);
    const h=locateCardAnyV4(ctx.card);
    if(h) API.setCardFlag(h,'v20MovingShadowTurn',gameState.turn,'うごめく影');
    done(true);},
  operation(ctx){ API.shuffleFaceDown(ctx.player,'うごめく影'); },
  afterResolve(){}
}],{type:'spell',subtype:'永続',priority:1,timing:['mainPhase','free']});

/* 相手はデッキから昆虫族1体を選び、シャッフルの後デッキの一番上に置く */
defineUnifiedCardV4('翡翠の蟲笛',[{
  key:'opponent-topdeck-insect',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:1,events:['activate'],
  condition(ctx){ return v20InsectPool(ctx.opponent).length>0; },
  operation(ctx){
    const pool=v20InsectPool(ctx.opponent);
    if(!pool.length) return;
    /* 選ぶのは相手。自分は中身を見ないので公開しない。 */
    v49P1Open(ctx,{kind:'card',title:'翡翠の蟲笛：相手が選ぶ昆虫族モンスター',
      candidates:pool,min:1,max:1},
      'p20rev.opponent-topdeck',{deckOwner:ctx.opponent,reason:'翡翠の蟲笛'},false);},
  afterResolve(){}
}],{type:'spell',priority:1,timing:['mainPhase']});
function v20InsectPool(p){
  return API.pileCards(p,'deck',x=>x.db.k==='m'&&x.db.ra==='昆虫');
}

/* メンタルシーカー・徴兵令・サイバー・エスパー・無効・おとり人形は
   除外元の特殊召喚宣言、相手デッキからの自分場への特殊召喚、
   ドロー結果の置き換え、強制発動が別に要る。ENGINE_GAP のまま残す。 */
