/* EffectCategory recovery batch — System v19 の効果カテゴリで解消したカード。
   使う共通機構は API.effectCategories / effectHasCategory /
   activationTargets（v19）、negateChainLink（v13）、
   addLpRule の chainId / redirect（v18）、onActivateSuccess（v12）、
   v7 の予約・既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v19Opponent(p){ return p===0?1:0; }
/* 「〜する効果が発動した時」の共通条件。自分自身の発動には反応しない。 */
function v19RespondsTo(ctx,cat,opts){
  const e=ctx.event;
  if(!e || !ctx.card) return false;
  if(e.uid===ctx.card.uid) return false;
  if(opts&&opts.opponentOnly&&e.player!==ctx.opponent) return false;
  if(opts&&opts.spellTrapOnly&&e.kind!=='spell'&&e.kind!=='trap') return false;
  return API.effectHasCategory(e,cat);
}
/* そのチェーンリンクが自分の魔法・罠カードを対象にしているか */
function v19TargetsOwnSpellTrap(ctx){
  return API.activationTargets(ctx.event)
    .some(h=>h && h.p===ctx.player && (h.zone==='sz'||h.zone==='field'));
}

/* ---- 選択の継続 --------------------------------------------------------- */
API.registerChoiceHandler('p19cat.opponent-discard',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.zone==='hand') API.discard(h.p,h.index,args.reason,{byEffect:true});
  v49P1FinishSource(args);
});

/* =====================================================================
   1. 破壊する効果に応答する
   -------------------------------------------------------------------
   スターダスト・ドラゴンは cards/46_v46_native.js に既にある。
   そこの v46LinkDestroysField がカード名の一覧を持っていたのを
   System v19 の効果カテゴリへ差し替えた。ここでは再定義しない。
   ===================================================================== */

/* 自分の魔法・罠を対象に「魔法・罠を破壊する」効果を発動された時、
   手札を1枚捨ててその発動と効果を無効にし破壊する */
defineUnifiedCardV4('ネイビィロイド',[{
  key:'negate-spelltrap-destruction',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:2,
  events:['onActivateSuccess'],
  condition(ctx){
    const h=locateCardAnyV4(ctx.card);
    return !!h&&h.zone==='mz'&&h.card.face==='up'
      &&v19RespondsTo(ctx,'destroy',{opponentOnly:true,spellTrapOnly:true})
      &&v19TargetsOwnSpellTrap(ctx)
      &&API.me(ctx).hand.length>0;},
  cost(ctx,done){
    const hand=API.pileCards(ctx.player,'hand');
    if(!hand.length){ done(false); return; }
    API.selectCard('ネイビィロイド：捨てる手札',hand,t=>{
      const h=resolveTarget(t);
      if(h) API.discard(ctx.player,h.index,'ネイビィロイド（コスト）',{byEffect:false});
      done(!!h);});},
  operation(ctx){
    API.negateChainLink(ctx.event,'activation','ネイビィロイド',true);},
  afterResolve(){}
}],{type:'monster',priority:2});

/* =====================================================================
   2. 手札を捨てる効果に応答する
   ===================================================================== */
/* 自分の手札を捨てる効果を含むカードを相手が発動した時、
   手札から墓地へ送って無効にし破壊し、1枚ドローする */
defineUnifiedCardV4('ヂェミナイ・デビル',[{
  key:'negate-discard-effect',type:EFFECT_TYPE.TRIGGER,range:LOCATION.HAND,speed:2,
  events:['onActivateSuccess'],
  condition(ctx){
    const h=locateCardAnyV4(ctx.card);
    return !!h&&h.zone==='hand'
      &&v19RespondsTo(ctx,'discard',{opponentOnly:true});},
  cost(ctx,done){
    const h=locateCardAnyV4(ctx.card);
    if(!h||h.zone!=='hand'){ done(false); return; }
    API.sendHandToGrave(ctx.player,h.index,'ヂェミナイ・デビル（コスト）');
    done(true);},
  operation(ctx){
    API.negateChainLink(ctx.event,'activation','ヂェミナイ・デビル',true);
    API.draw(ctx.player,1);},
  afterResolve(){}
}],{type:'monster',priority:2,activateFrom:['hand'],
    timing:['mainPhase','opponentTurn','free']});

/* =====================================================================
   3. ダメージを与える効果に応答する
   ===================================================================== */
/* 発動と効果を無効にし、お互いが1枚ドローする */
defineUnifiedCardV4('ダメージ・ポラリライザー',[{
  key:'negate-damage-effect-both-draw',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:3,events:['onActivateSuccess'],
  condition(ctx){ return v19RespondsTo(ctx,'damage'); },
  operation(ctx){
    API.negateChainLink(ctx.event,'activation','ダメージ・ポラリライザー',false);
    API.draw(ctx.player,1);
    API.draw(ctx.opponent,1);},
  afterResolve(){}
}],{type:'trap',priority:3});

/* 発動と効果を無効にし、融合デッキからランダムに融合モンスター1体を墓地へ送る */
defineUnifiedCardV4('フュージョン・ガード',[{
  key:'negate-damage-effect-mill-fusion',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:3,events:['onActivateSuccess'],
  condition(ctx){ return v19RespondsTo(ctx,'damage')&&v19FusionPool(ctx).length>0; },
  operation(ctx){
    API.negateChainLink(ctx.event,'activation','フュージョン・ガード',false);
    const pool=v19FusionPool(ctx);
    if(!pool.length) return;
    /* 決定論的な乱数。Replay でも同じカードが選ばれる。 */
    const i=duelRandomInt(pool.length);
    const h=locateCardAnyV4(pool[i].card);
    if(h) API.sendToGrave(h,'フュージョン・ガード');},
  afterResolve(){}
}],{type:'trap',priority:3});
function v19FusionPool(ctx){
  return API.pileCards(ctx.player,'ex',x=>(x.db.st||[]).indexOf('融合')>=0);
}

/* 自分が受けるその効果ダメージを無効にし、相手は手札を1枚選んで捨てる */
defineUnifiedCardV4('黒板消しの罠',[{
  key:'stop-that-effect-damage',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:3,events:['onActivateSuccess'],
  condition(ctx){ return v19RespondsTo(ctx,'damage'); },
  operation(ctx){
    /* そのチェーンリンクの間だけ、自分が受ける効果ダメージを0にする。 */
    API.addLpRule({player:ctx.player,cause:'effect',mode:'prevent',turns:0,
      chainId:ctx.event.chainId,label:'黒板消しの罠'});
    const hand=API.pileCards(ctx.opponent,'hand');
    if(!hand.length) return;
    v49P1Open(ctx,{kind:'card',title:'黒板消しの罠：相手が捨てる手札',
      candidates:hand,min:1,max:1},'p19cat.opponent-discard',
      {reason:'黒板消しの罠'},true);},
  afterResolve(){}
}],{type:'trap',priority:3});

/* 自分が受けるその効果ダメージを相手に与える */
defineUnifiedCardV4('地獄の扉越し銃',[{
  key:'redirect-that-effect-damage',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:3,events:['onActivateSuccess'],
  condition(ctx){ return v19RespondsTo(ctx,'damage'); },
  operation(ctx){
    API.addLpRule({player:ctx.player,cause:'effect',mode:'redirect',
      toPlayer:ctx.opponent,turns:0,chainId:ctx.event.chainId,
      label:'地獄の扉越し銃'});},
  afterResolve(){}
}],{type:'trap',priority:3});

/* 悲劇の引き金・シフトチェンジ・六武衆の影武者・トマボー・埋蔵金の地図は
   「対象になった時」のイベントとチェーン構築中の対象変更が別に要る。
   ラッキー・チャンス! はコイントスを行う効果である事の宣言と
   結果イベントが要る。いずれも ENGINE_GAP のまま残す。 */
